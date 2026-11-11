package com.fleetos.api.billing;

import com.fleetos.api.billing.BillingService.ClaimResponse;
import com.fleetos.api.billing.BillingService.InvoiceResponse;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Claim;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Billing: billable trips → claims → invoices. Amounts use the documented
 * $45.00 placeholder rate (see BillingService) until real broker rate
 * tables exist. The CMS-1500 endpoint returns structured form data as
 * JSON — data for a claim form, not a filed claim or a printable PDF.
 */
@RestController
@RequestMapping("/api/billing")
public class BillingController {

  private final BillingService billingService;

  public BillingController(BillingService billingService) {
    this.billingService = billingService;
  }

  /** Create a claim from a completed + billable trip (409 otherwise). */
  @PostMapping("/claims/from-trip/{tripId}")
  public ResponseEntity<ClaimResponse> createFromTrip(
      @AuthenticationPrincipal AppUser user,
      @PathVariable String tripId,
      @RequestBody(required = false) Map<String, String> body) {
    Claim claim = billingService.createClaimFromTrip(user, tripId,
        body == null ? null : body.get("broker"),
        body == null ? null : body.get("payer"));
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(billingService.toResponse(claim));
  }

  @GetMapping("/claims")
  public List<ClaimResponse> list(
      @AuthenticationPrincipal AppUser user,
      @RequestParam(required = false) String status) {
    return billingService.listClaims(user, status).stream()
        .map(billingService::toResponse)
        .toList();
  }

  @GetMapping("/claims/{id}")
  public ClaimResponse get(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    return billingService.toResponse(billingService.getClaim(user, id));
  }

  /** DRAFT → SUBMITTED (also creates the invoice, SENT, due in 30 days). */
  @PostMapping("/claims/{id}/submit")
  public ClaimResponse submit(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    return billingService.toResponse(billingService.submitClaim(user, id));
  }

  /** SUBMITTED → PAID (also marks the invoice PAID). */
  @PostMapping("/claims/{id}/mark-paid")
  public ClaimResponse markPaid(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    return billingService.toResponse(billingService.markPaid(user, id));
  }

  /** → DENIED (with a reason; dispatchers are notified). */
  @PostMapping("/claims/{id}/mark-denied")
  public ClaimResponse markDenied(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id,
      @RequestBody(required = false) Map<String, String> body) {
    return billingService.toResponse(billingService.markDenied(user, id,
        body == null ? null : body.get("reason")));
  }

  /** Structured CMS-1500 form data for the claim (JSON, not a PDF). */
  @GetMapping("/claims/{id}/cms1500")
  public ResponseEntity<Map<String, Object>> cms1500(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    Claim claim = billingService.getClaim(user, id);
    Map<String, Object> body = new java.util.LinkedHashMap<>();
    body.put("claimNumber", claim.getClaimNumber());
    body.put("tripCode", claim.getTrip().getCode());
    body.put("status", claim.getStatus());
    body.put("amount", claim.getAmount());
    body.put("cms1500", claim.getCms1500Json() == null ? null
        : parseJson(claim.getCms1500Json()));
    body.put("note", "Structured CMS-1500 form data — not a filed claim and "
        + "not a printable PDF. Fields under cms1500.placeholders must be "
        + "replaced with the payer's real values before filing.");
    return ResponseEntity.ok(body);
  }

  private Object parseJson(String json) {
    try {
      return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Object.class);
    } catch (Exception e) {
      return json;
    }
  }

  @GetMapping("/invoices")
  public List<InvoiceResponse> invoices(
      @AuthenticationPrincipal AppUser user,
      @RequestParam(required = false) String status) {
    return billingService.listInvoices(user, status).stream()
        .map(billingService::toInvoiceResponse)
        .toList();
  }
}
