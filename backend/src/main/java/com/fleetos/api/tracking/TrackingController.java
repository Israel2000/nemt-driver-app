package com.fleetos.api.tracking;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.tracking.TrackingService.PublicTrackingResponse;
import com.fleetos.api.tracking.TrackingService.TrackingLinkResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rider tracking links. The link-creation endpoint is JWT-required
 * (dispatchers only); the public endpoint needs NO auth and returns only
 * the safe subset — status, ETA, driver first name + vehicle, pickup /
 * dropoff areas. Unknown or expired tokens are a 404.
 */
@RestController
public class TrackingController {

  private final TrackingService trackingService;

  public TrackingController(TrackingService trackingService) {
    this.trackingService = trackingService;
  }

  /** Create (or return the existing) tracking link for a trip. */
  @PostMapping("/api/trips/{id}/tracking-link")
  public ResponseEntity<TrackingLinkResponse> createLink(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(trackingService.createLink(user, id));
  }

  /** Public tracking view — no auth. Safe subset only (see TrackingService). */
  @GetMapping("/api/public/tracking/{token}")
  public PublicTrackingResponse publicView(@PathVariable String token) {
    return trackingService.publicView(token);
  }
}
