package com.fleetos.api.trips;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.trips.TripDtos.AssignRequest;
import com.fleetos.api.trips.TripDtos.CreateTripRequest;
import com.fleetos.api.trips.TripDtos.EtaResponse;
import com.fleetos.api.trips.TripDtos.MessageRequest;
import com.fleetos.api.trips.TripDtos.MessageResponse;
import com.fleetos.api.trips.TripDtos.ProofRequest;
import com.fleetos.api.trips.TripDtos.SecurementRequest;
import com.fleetos.api.trips.TripDtos.SecurementResponse;
import com.fleetos.api.trips.TripDtos.StatusRequest;
import com.fleetos.api.trips.TripDtos.TripEventResponse;
import com.fleetos.api.trips.TripDtos.TripResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Trips API. All endpoints are JWT-required and workspace-scoped; {id}
 * accepts either the UUID or the human code (TRP-101). Drivers only see
 * and act on trips assigned to them.
 */
@RestController
@RequestMapping("/api/trips")
public class TripController {

  private final TripService tripService;

  public TripController(TripService tripService) {
    this.tripService = tripService;
  }

  @GetMapping
  public List<TripResponse> list(
      @AuthenticationPrincipal AppUser user,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String driver) {
    return tripService.listTrips(user, status, driver);
  }

  @GetMapping("/{id}")
  public TripResponse get(@AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return tripService.getTrip(user, id);
  }

  @PostMapping
  public ResponseEntity<TripResponse> create(
      @AuthenticationPrincipal AppUser user, @RequestBody CreateTripRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createTrip(user, req));
  }

  @PatchMapping("/{id}/assign")
  public TripResponse assign(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody AssignRequest req) {
    return tripService.assignTrip(user, id, req);
  }

  @PostMapping("/{id}/status")
  public TripResponse changeStatus(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody StatusRequest req) {
    return tripService.changeStatus(user, id, req);
  }

  @PostMapping("/{id}/securement")
  public SecurementResponse saveSecurement(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody SecurementRequest req) {
    return tripService.saveSecurement(user, id, req);
  }

  @PostMapping("/{id}/proof")
  public TripResponse saveProof(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody ProofRequest req) {
    return tripService.saveProof(user, id, req);
  }

  @GetMapping("/{id}/events")
  public List<TripEventResponse> events(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return tripService.listEvents(user, id);
  }

  @GetMapping("/{id}/messages")
  public List<MessageResponse> messages(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return tripService.listMessages(user, id);
  }

  @PostMapping("/{id}/messages")
  public ResponseEntity<MessageResponse> postMessage(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody MessageRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(tripService.postMessage(user, id, req));
  }

  @GetMapping("/{id}/eta")
  public EtaResponse eta(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestParam(defaultValue = "dropoff") String to) {
    return tripService.eta(user, id, to);
  }
}
