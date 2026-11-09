package com.fleetos.api.sync;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.SyncOutboxEvent;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.domain.TripStatus;
import com.fleetos.api.repo.SyncOutboxEventRepository;
import com.fleetos.api.trips.TripDtos.MessageRequest;
import com.fleetos.api.trips.TripDtos.ProofRequest;
import com.fleetos.api.trips.TripDtos.SecurementRequest;
import com.fleetos.api.trips.TripDtos.StatusRequest;
import com.fleetos.api.trips.TripService;
import com.fleetos.api.trips.TripStatusMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Offline-outbox sync. The client queues events while offline (each with a
 * client-generated id) and flushes them oldest-first on reconnect. Events
 * are applied in the order received; a clientEventId already seen in this
 * workspace is reported as DUPLICATE and never re-applied.
 *
 * Supported kinds: status, assignment, message, securement, proof,
 * exception (recorded as an audit event only). dvir and unknown kinds are
 * REJECTED with a reason.
 */
@RestController
@RequestMapping("/api/sync")
public class SyncController {

  private final SyncOutboxEventRepository outbox;
  private final TripService tripService;
  private final ObjectMapper objectMapper;

  public SyncController(SyncOutboxEventRepository outbox, TripService tripService,
      ObjectMapper objectMapper) {
    this.outbox = outbox;
    this.tripService = tripService;
    this.objectMapper = objectMapper;
  }

  public record SyncEvent(
      String clientEventId,
      String kind,
      String tripId,
      JsonNode payload) {}

  public record SyncBatch(List<SyncEvent> events) {}

  public record SyncEventResult(String clientEventId, String result, String detail) {}

  public record SyncResponse(List<SyncEventResult> results) {}

  // Deliberately NOT @Transactional: each event applies in its own
  // transaction (TripService methods are @Transactional). A rejected event
  // (e.g. an illegal transition) rolls back only itself; the catch in
  // apply() records REJECTED and the batch continues. Wrapping the whole
  // batch in one transaction would mark it rollback-only on the first
  // rejection and fail the entire flush with a 500.
  @PostMapping("/outbox")
  public ResponseEntity<SyncResponse> flush(
      @AuthenticationPrincipal AppUser user, @RequestBody SyncBatch batch) {
    List<SyncEventResult> results = new ArrayList<>();
    if (batch.events() == null) {
      return ResponseEntity.ok(new SyncResponse(results));
    }
    for (SyncEvent event : batch.events()) {
      results.add(apply(user, event));
    }
    return ResponseEntity.ok(new SyncResponse(results));
  }

  private SyncEventResult apply(AppUser user, SyncEvent event) {
    String clientEventId = event.clientEventId();
    if (clientEventId == null || clientEventId.isBlank()) {
      return new SyncEventResult(clientEventId, "REJECTED", "clientEventId is required");
    }
    // Idempotency: already seen in this workspace → duplicate, never re-apply.
    if (outbox.findByWorkspaceIdAndClientEventId(user.getWorkspace().getId(), clientEventId).isPresent()) {
      return new SyncEventResult(clientEventId, "DUPLICATE", "already applied");
    }
    SyncOutboxEvent record = new SyncOutboxEvent(user.getWorkspace(), clientEventId,
        event.kind() == null ? "unknown" : event.kind(), "APPLIED");
    try {
      Trip trip = null;
      if (event.tripId() != null && !event.tripId().isBlank()) {
        try {
          trip = tripService.resolveTrip(user, event.tripId());
        } catch (ApiException notFound) {
          // A queued CREATE carries the full trip in the payload and the
          // trip does not exist server-side yet — that is expected, not an
          // error (applyAssignment creates it below). Anything else 404s.
          JsonNode payload = event.payload();
          boolean isCreate = "assignment".equals(record.getKind())
              && payload != null && payload.hasNonNull("patientName");
          if (!isCreate) {
            throw notFound;
          }
        }
        if (trip != null) {
          record.setTrip(trip);
        }
      }
      JsonNode payload = event.payload() == null
          ? objectMapper.createObjectNode() : event.payload();
      switch (record.getKind()) {
        case "status" -> applyStatus(user, trip, payload);
        case "assignment" -> applyAssignment(user, trip, payload);
        case "message" -> applyMessage(user, trip, payload);
        case "securement" -> applySecurement(user, trip, payload);
        case "proof" -> applyProof(user, trip, payload);
        case "exception" -> {
          // Exceptions are audit-only: nothing to apply to a trip.
          record.setDetail("recorded as audit event only");
        }
        default -> {
          record.setResult("REJECTED");
          record.setDetail("unsupported kind: " + record.getKind());
          outbox.save(record);
          return new SyncEventResult(clientEventId, "REJECTED", record.getDetail());
        }
      }
      outbox.save(record);
      return new SyncEventResult(clientEventId, "APPLIED", record.getDetail());
    } catch (ApiException ex) {
      record.setResult("REJECTED");
      record.setDetail(ex.getMessage());
      outbox.save(record);
      return new SyncEventResult(clientEventId, "REJECTED", ex.getMessage());
    }
  }

  private void applyStatus(AppUser user, Trip trip, JsonNode p) {
    requireTrip(trip, "status");
    String status = text(p, "status");
    if (status == null) {
      throw ApiException.badRequest("status event is missing payload.status");
    }
    StatusRequest req = new StatusRequest(
        status,
        decimal(p, "lat"), decimal(p, "lng"), text(p, "gpsSource"),
        text(p, "reasonCode"), text(p, "reasonNote"),
        bool(p, "confirm"),
        integer(p, "odometerEnd"),
        bool(p, "passengerSignature"), text(p, "passengerSignatureData"),
        bool(p, "driverSignature"), text(p, "driverSignatureData"),
        text(p, "driverSignatureName"), text(p, "signeeName"), text(p, "signeeType"));
    tripService.changeStatus(user, trip.getCode(), req);
  }

  private void applyAssignment(AppUser user, Trip trip, JsonNode p) {
    // A queued create (no trip yet) carries the full trip in the payload,
    // in the FRONTEND's field names (patientName, driverCode, ...) — map
    // them onto the server's CreateTripRequest explicitly.
    if (trip == null && p.hasNonNull("patientName")) {
      tripService.createTrip(user, new com.fleetos.api.trips.TripDtos.CreateTripRequest(
          text(p, "code"),
          text(p, "patientName"),
          text(p, "patientPhone"),
          text(p, "mobility"),
          text(p, "pickupAddress"), decimal(p, "pickupLat"), decimal(p, "pickupLng"),
          text(p, "dropoffAddress"), decimal(p, "dropoffLat"), decimal(p, "dropoffLng"),
          instant(p, "scheduledAt"),
          text(p, "driverCode"), text(p, "vehicleLabel"),
          bool(p, "wheelchair"), integer(p, "odometerStart")));
      return;
    }
    requireTrip(trip, "assignment");
    tripService.assignTrip(user, trip.getCode(),
        new com.fleetos.api.trips.TripDtos.AssignRequest(
            text(p, "driverCode"), text(p, "vehicleLabel")));
  }

  private void applyMessage(AppUser user, Trip trip, JsonNode p) {
    requireTrip(trip, "message");
    String body = text(p, "body");
    if (body == null || body.isBlank()) {
      throw ApiException.badRequest("message event is missing payload.body");
    }
    tripService.postMessage(user, trip.getCode(), new MessageRequest(body, text(p, "fromName")));
  }

  private void applySecurement(AppUser user, Trip trip, JsonNode p) {
    requireTrip(trip, "securement");
    SecurementRequest req = new SecurementRequest(
        bool(p, "positioned"), bool(p, "tieDownFrontLeft"), bool(p, "tieDownFrontRight"),
        bool(p, "tieDownRearLeft"), bool(p, "tieDownRearRight"), bool(p, "brakesSet"),
        bool(p, "lapBelt"), bool(p, "shoulderBelt"), text(p, "completedBy"));
    tripService.saveSecurement(user, trip.getCode(), req);
  }

  private void applyProof(AppUser user, Trip trip, JsonNode p) {
    requireTrip(trip, "proof");
    ProofRequest req = new ProofRequest(
        integer(p, "odometerEnd"),
        bool(p, "passengerSignature"), text(p, "passengerSignatureData"),
        bool(p, "driverSignature"), text(p, "driverSignatureData"),
        text(p, "driverSignatureName"), text(p, "signeeName"), text(p, "signeeType"));
    tripService.saveProof(user, trip.getCode(), req);
  }

  private void requireTrip(Trip trip, String kind) {
    if (trip == null) {
      throw ApiException.badRequest(kind + " event is missing tripId");
    }
  }

  private static String text(JsonNode p, String field) {
    JsonNode n = p.get(field);
    return n == null || n.isNull() ? null : n.asText();
  }

  private static BigDecimal decimal(JsonNode p, String field) {
    JsonNode n = p.get(field);
    return n == null || n.isNull() || !n.isNumber() ? null : n.decimalValue();
  }

  private static Boolean bool(JsonNode p, String field) {
    JsonNode n = p.get(field);
    return n == null || n.isNull() || !n.isBoolean() ? null : n.asBoolean();
  }

  private static Integer integer(JsonNode p, String field) {
    JsonNode n = p.get(field);
    return n == null || n.isNull() || !n.isNumber() ? null : n.asInt();
  }

  private static java.time.Instant instant(JsonNode p, String field) {
    JsonNode n = p.get(field);
    if (n == null || n.isNull()) {
      return null;
    }
    try {
      return java.time.Instant.parse(n.asText());
    } catch (RuntimeException e) {
      return null;
    }
  }
}
