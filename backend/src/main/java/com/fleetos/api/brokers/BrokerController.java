package com.fleetos.api.brokers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fleetos.api.brokers.BrokerService.BrokerConnectionResponse;
import com.fleetos.api.brokers.BrokerService.BrokerTripResponse;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.trips.TripDtos.TripResponse;
import java.util.List;
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
 * Broker integrations — intake + mapping only (see BrokerService).
 * No live broker API connection exists; all brokers report NOT_CONNECTED
 * with a credentials_required note until real credentials are configured.
 */
@RestController
@RequestMapping("/api/brokers")
public class BrokerController {

  private final BrokerService brokerService;

  public BrokerController(BrokerService brokerService) {
    this.brokerService = brokerService;
  }

  /** All known brokers with their honest connection status. */
  @GetMapping
  public List<BrokerConnectionResponse> list(
      @AuthenticationPrincipal AppUser user) {
    return brokerService.listConnections(user).stream()
        .map(brokerService::toConnectionResponse)
        .toList();
  }

  /** Accept one broker trip payload (validated + normalised, deduped). */
  @PostMapping("/{broker}/intake")
  public ResponseEntity<BrokerTripResponse> intake(
      @AuthenticationPrincipal AppUser user,
      @PathVariable String broker,
      @RequestBody JsonNode payload) {
    String key = BrokerService.normalizeBroker(broker);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(brokerService.toTripResponse(brokerService.intake(user, key, payload)));
  }

  /** Intake records for one broker (optional status filter). */
  @GetMapping("/{broker}/trips")
  public List<BrokerTripResponse> listTrips(
      @AuthenticationPrincipal AppUser user,
      @PathVariable String broker,
      @RequestParam(required = false) String status) {
    String key = BrokerService.normalizeBroker(broker);
    return brokerService.listIntake(user, key, status).stream()
        .map(brokerService::toTripResponse)
        .toList();
  }

  /** Import one intake record into a real Trip (DQF check still applies). */
  @PostMapping("/{broker}/trips/{intakeId}/import")
  public ResponseEntity<TripResponse> importTrip(
      @AuthenticationPrincipal AppUser user,
      @PathVariable String broker,
      @PathVariable UUID intakeId) {
    String key = BrokerService.normalizeBroker(broker);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(brokerService.importIntake(user, key, intakeId));
  }
}
