package com.fleetos.api.billing;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Claim;
import com.fleetos.api.domain.Invoice;
import com.fleetos.api.domain.Role;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.domain.TripStatus;
import com.fleetos.api.notify.NotificationService;
import com.fleetos.api.repo.ClaimRepository;
import com.fleetos.api.repo.InvoiceRepository;
import com.fleetos.api.trips.TripService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Billing: billable trips → claims → invoices.
 *
 * <p><b>Placeholder rate (documented, not real):</b> trips carry no price,
 * so a claim is priced at a flat <b>$45.00</b> per completed billable trip.
 * That is a stand-in until real broker rate tables exist — real Medicaid
 * NEMT rates vary by broker, mileage and level of service, and filing a
 * real claim needs the broker's contracted rate. Do not treat $45 as a
 * contracted rate.
 *
 * <p><b>CMS-1500:</b> GET /api/billing/claims/{id}/cms1500 returns the
 * structured form data as JSON (box numbers included). It is data for a
 * claim form, not a filed claim and not a printable PDF — fields that are
 * placeholders (procedure code, place of service, NPI, diagnosis) are
 * listed in the response's {@code placeholders} array. A printable
 * CMS-1500 PDF needs a PDF library + the payer's exact layout and is
 * intentionally out of scope here.
 */
@Service
public class BillingService {

  /** Documented placeholder rate per completed billable trip. */
  public static final BigDecimal PLACEHOLDER_RATE = new BigDecimal("45.00");

  private final ClaimRepository claims;
  private final InvoiceRepository invoices;
  private final TripService tripService;
  private final NotificationService notifications;
  private final ObjectMapper objectMapper;

  public BillingService(ClaimRepository claims, InvoiceRepository invoices,
      TripService tripService, NotificationService notifications,
      ObjectMapper objectMapper) {
    this.claims = claims;
    this.invoices = invoices;
    this.tripService = tripService;
    this.notifications = notifications;
    this.objectMapper = objectMapper;
  }

  public static void requireDispatcher(AppUser user) {
    if (user.getRole() != Role.ADMIN && user.getRole() != Role.DISPATCHER) {
      throw ApiException.forbidden("Only dispatchers and admins can do this");
    }
  }

  private String nextClaimNumber(AppUser user) {
    int max = 1000;
    for (Claim c : claims.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())) {
      String n = c.getClaimNumber();
      if (n != null && n.startsWith("CLM-")) {
        try {
          max = Math.max(max, Integer.parseInt(n.substring(4)));
        } catch (NumberFormatException ignored) {
          // Non-numeric claim number — ignore for sequencing.
        }
      }
    }
    return "CLM-" + (max + 1);
  }

  private String nextInvoiceNumber(AppUser user) {
    int max = 1000;
    for (Invoice inv : invoices.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())) {
      String n = inv.getInvoiceNumber();
      if (n != null && n.startsWith("INV-")) {
        try {
          max = Math.max(max, Integer.parseInt(n.substring(4)));
        } catch (NumberFormatException ignored) {
          // ignore
        }
      }
    }
    return "INV-" + (max + 1);
  }

  /** Build the structured CMS-1500 form data for a claim. */
  public String buildCms1500Json(Claim claim) {
    Trip trip = claim.getTrip();
    Map<String, Object> form = new LinkedHashMap<>();
    form.put("form", "CMS-1500 (02/12)");
    form.put("claimNumber", claim.getClaimNumber());
    form.put("generatedAt", Instant.now().toString());
    form.put("disclaimer", "Structured claim data only — not a filed claim and not a printable CMS-1500 form. "
        + "Fields listed under 'placeholders' must be replaced with the payer's real values before filing.");
    form.put("placeholders", List.of(
        "box24.procedureCode (A0100 — placeholder; confirm the broker's contracted HCPCS code)",
        "box24.placeOfService (41 — placeholder; confirm the payer's place-of-service code)",
        "box21.diagnosis (not on file for transport-only trips)",
        "box25.federalTaxId / box32 / box33 NPI (not on file — add the provider's real NPI)",
        "amount (flat $45.00 placeholder rate — see BillingService.PLACEHOLDER_RATE)"));
    Map<String, Object> boxes = new LinkedHashMap<>();
    boxes.put("box1_payer", claim.getPayer());
    boxes.put("box2_patientName", trip.getRiderName());
    boxes.put("box3_patientDob", null);
    boxes.put("box5_patientAddress", trip.getPickupAddress());
    boxes.put("box21_diagnosis", null);
    Map<String, Object> line = new LinkedHashMap<>();
    line.put("dateOfService", trip.getCompletedAt() == null ? null : trip.getCompletedAt().toString());
    line.put("placeOfService", "41");
    line.put("procedureCode", "A0100");
    line.put("units", 1);
    line.put("charge", claim.getAmount());
    boxes.put("box24_serviceLine", line);
    boxes.put("box25_federalTaxId", null);
    boxes.put("box28_totalCharge", claim.getAmount());
    boxes.put("box31_renderingProvider", claim.getWorkspace().getName());
    boxes.put("box32_serviceFacility", trip.getDropoffAddress());
    boxes.put("box33_billingProvider", claim.getWorkspace().getName());
    boxes.put("box33_billingProviderNpi", null);
    form.put("boxes", boxes);
    try {
      return objectMapper.writeValueAsString(form);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Could not serialise CMS-1500 data", e);
    }
  }

  @Transactional
  public Claim createClaimFromTrip(AppUser user, String tripIdOrCode, String broker, String payer) {
    requireDispatcher(user);
    Trip trip = tripService.resolveTrip(user, tripIdOrCode);
    if (trip.getStatus() != TripStatus.COMPLETED || !trip.isBillable()) {
      throw ApiException.conflict(
          "Only completed, billable trips can be claimed (trip " + trip.getCode()
              + " is " + trip.getStatus() + ", billable=" + trip.isBillable() + ")",
          Map.of("tripCode", trip.getCode(), "status", trip.getStatus().name(),
              "billable", trip.isBillable()));
    }
    if (claims.existsByTripId(trip.getId())) {
      Claim existing = claims.findByTripId(trip.getId()).orElseThrow();
      throw ApiException.conflict("Trip already has a claim",
          Map.of("claimNumber", existing.getClaimNumber()));
    }
    Claim claim = new Claim(nextClaimNumber(user), user.getWorkspace(), trip, PLACEHOLDER_RATE);
    claim.setBroker(broker);
    claim.setPayer(payer == null || payer.isBlank()
        ? (broker == null ? "Medicaid" : broker) : payer);
    claim.setCms1500Json(buildCms1500Json(claim));
    return claims.save(claim);
  }

  @Transactional(readOnly = true)
  public List<Claim> listClaims(AppUser user, String status) {
    if (status == null || status.isBlank()) {
      return claims.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
    }
    return claims.findByWorkspaceIdAndStatusOrderByCreatedAtDesc(
        user.getWorkspace().getId(), status.toUpperCase());
  }

  @Transactional(readOnly = true)
  public Claim getClaim(AppUser user, UUID id) {
    return claims.findById(id)
        .filter(c -> c.getWorkspace().getId().equals(user.getWorkspace().getId()))
        .orElseThrow(() -> ApiException.notFound("Claim"));
  }

  @Transactional
  public Claim submitClaim(AppUser user, UUID id) {
    requireDispatcher(user);
    Claim claim = getClaim(user, id);
    if (!"DRAFT".equals(claim.getStatus())) {
      throw ApiException.conflict("Only a DRAFT claim can be submitted (current: " + claim.getStatus() + ")",
          Map.of("status", claim.getStatus()));
    }
    claim.setStatus("SUBMITTED");
    claim.setSubmittedAt(Instant.now());
    claim.setUpdatedAt(Instant.now());
    claim = claims.save(claim);
    // Submitting creates the invoice (SENT, due in 30 days).
    Invoice invoice = new Invoice(nextInvoiceNumber(user), user.getWorkspace(), claim, claim.getAmount());
    invoice.setStatus("SENT");
    invoice.setDueAt(Instant.now().plus(30, ChronoUnit.DAYS));
    invoices.save(invoice);
    return claim;
  }

  @Transactional
  public Claim markPaid(AppUser user, UUID id) {
    requireDispatcher(user);
    Claim claim = getClaim(user, id);
    if (!"SUBMITTED".equals(claim.getStatus())) {
      throw ApiException.conflict("Only a SUBMITTED claim can be marked paid (current: " + claim.getStatus() + ")",
          Map.of("status", claim.getStatus()));
    }
    claim.setStatus("PAID");
    claim.setPaidAt(Instant.now());
    claim.setUpdatedAt(Instant.now());
    claim = claims.save(claim);
    for (Invoice inv : invoices.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId())) {
      if (inv.getClaim() != null && inv.getClaim().getId().equals(claim.getId())
          && !"PAID".equals(inv.getStatus())) {
        inv.setStatus("PAID");
        invoices.save(inv);
      }
    }
    return claim;
  }

  @Transactional
  public Claim markDenied(AppUser user, UUID id, String reason) {
    requireDispatcher(user);
    Claim claim = getClaim(user, id);
    if ("PAID".equals(claim.getStatus())) {
      throw ApiException.conflict("A PAID claim cannot be denied",
          Map.of("status", claim.getStatus()));
    }
    claim.setStatus("DENIED");
    claim.setDenialReason(reason);
    claim.setUpdatedAt(Instant.now());
    claim = claims.save(claim);
    notifications.onClaimDenied(user.getWorkspace(), claim.getClaimNumber(), reason);
    return claim;
  }

  @Transactional(readOnly = true)
  public List<Invoice> listInvoices(AppUser user, String status) {
    if (status == null || status.isBlank()) {
      return invoices.findByWorkspaceIdOrderByCreatedAtDesc(user.getWorkspace().getId());
    }
    return invoices.findByWorkspaceIdAndStatusOrderByCreatedAtDesc(
        user.getWorkspace().getId(), status.toUpperCase());
  }

  public ClaimResponse toResponse(Claim claim) {
    List<String> placeholders = new ArrayList<>();
    try {
      Map<?, ?> form = objectMapper.readValue(claim.getCms1500Json(), Map.class);
      Object ph = form.get("placeholders");
      if (ph instanceof List<?> list) {
        for (Object o : list) {
          placeholders.add(String.valueOf(o));
        }
      }
    } catch (Exception ignored) {
      // CMS-1500 JSON missing/unparseable: placeholders stay empty.
    }
    return new ClaimResponse(
        claim.getId(), claim.getClaimNumber(),
        claim.getTrip().getCode(), claim.getTrip().getRiderName(),
        claim.getBroker(), claim.getPayer(), claim.getStatus(),
        claim.getAmount(), claim.getCurrency(),
        claim.getDenialReason(), claim.getSubmittedAt(), claim.getPaidAt(),
        claim.getCreatedAt(), placeholders);
  }

  public InvoiceResponse toInvoiceResponse(Invoice invoice) {
    return new InvoiceResponse(
        invoice.getId(), invoice.getInvoiceNumber(),
        invoice.getClaim() == null ? null : invoice.getClaim().getClaimNumber(),
        invoice.getAmount(), invoice.getStatus(), invoice.getDueAt(), invoice.getCreatedAt());
  }

  public record ClaimResponse(
      UUID id, String claimNumber, String tripCode, String riderName,
      String broker, String payer, String status,
      BigDecimal amount, String currency, String denialReason,
      Instant submittedAt, Instant paidAt, Instant createdAt,
      List<String> placeholders) {}

  public record InvoiceResponse(
      UUID id, String invoiceNumber, String claimNumber,
      BigDecimal amount, String status, Instant dueAt, Instant createdAt) {}
}
