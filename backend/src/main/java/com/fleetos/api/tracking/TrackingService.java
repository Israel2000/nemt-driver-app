package com.fleetos.api.tracking;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.common.Geo;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.TrackingToken;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.repo.TrackingTokenRepository;
import com.fleetos.api.trips.TripService;
import com.fleetos.api.trips.TripStatusMapper;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rider tracking links: a signed, expiring token per trip.
 * <ul>
 *   <li>Tokens expire 24h after the trip completes (7 days after scheduling
 *       if the trip never completes).</li>
 *   <li>The public endpoint needs no login and returns ONLY the safe
 *       subset: status, ETA, driver first name + vehicle, pickup/dropoff
 *       areas (city/state, never the full street address), and the trip
 *       code. No rider phone, no full addresses, no signatures, no
 *       internal ids.</li>
 *   <li>An unknown or expired token is a 404 — indistinguishable from a
 *       trip that does not exist, so tokens cannot be probed.</li>
 * </ul>
 */
@Service
public class TrackingService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final TrackingTokenRepository tokens;
  private final TripService tripService;

  public TrackingService(TrackingTokenRepository tokens, TripService tripService) {
    this.tokens = tokens;
    this.tripService = tripService;
  }

  private static String newToken() {
    byte[] bytes = new byte[24];
    RANDOM.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  private static Instant expiryFor(Trip trip) {
    if (trip.getCompletedAt() != null) {
      return trip.getCompletedAt().plus(24, ChronoUnit.HOURS);
    }
    Instant base = trip.getScheduledAt() != null ? trip.getScheduledAt() : Instant.now();
    return base.plus(7, ChronoUnit.DAYS);
  }

  /** Expiry for a (re)issued token: 24h after completion, else 7 days after
   * scheduling — never in the past (a re-issued link gets 24h from now). */
  private static Instant freshExpiryFor(Trip trip) {
    Instant expiry = expiryFor(trip);
    return expiry.isBefore(Instant.now())
        ? Instant.now().plus(24, ChronoUnit.HOURS) : expiry;
  }

  /** Create (or return the existing) tracking link for a trip. */
  @Transactional
  public TrackingLinkResponse createLink(AppUser user, String tripIdOrCode) {
    TripService.requireDispatcher(user);
    Trip trip = tripService.resolveTrip(user, tripIdOrCode);
    TrackingToken existing = tokens.findByTripId(trip.getId()).orElse(null);
    if (existing != null && existing.getExpiresAt().isAfter(Instant.now())) {
      return toLinkResponse(existing);
    }
    if (existing != null) {
      existing.setExpiresAt(freshExpiryFor(trip));
      // Keep the same token value (links already shared stay valid); just extend.
      return toLinkResponse(tokens.save(existing));
    }
    TrackingToken token = new TrackingToken(trip, user.getWorkspace(), newToken(), freshExpiryFor(trip));
    token = tokens.save(token);
    return toLinkResponse(token);
  }

  /** Public, unauthenticated view — safe subset only. */
  @Transactional(readOnly = true)
  public PublicTrackingResponse publicView(String tokenValue) {
    TrackingToken token = tokens.findByToken(tokenValue)
        .orElseThrow(() -> ApiException.notFound("Tracking link"));
    if (token.getExpiresAt().isBefore(Instant.now())) {
      throw ApiException.notFound("Tracking link");
    }
    Trip trip = token.getTrip();
    String driverFirstName = null;
    if (trip.getDriver() != null && trip.getDriver().displayName() != null) {
      String[] parts = trip.getDriver().displayName().split("\\s+");
      driverFirstName = parts.length > 0 ? parts[0] : null;
    }
    Integer etaMinutes = null;
    try {
      double fromLat = trip.getGpsLat() != null ? trip.getGpsLat().doubleValue()
          : (trip.getPickupLat() != null ? trip.getPickupLat().doubleValue() : Double.NaN);
      double fromLng = trip.getGpsLng() != null ? trip.getGpsLng().doubleValue()
          : (trip.getPickupLng() != null ? trip.getPickupLng().doubleValue() : Double.NaN);
      boolean toDropoff = trip.getStatus().name().equals("BOARDED")
          || trip.getStatus().name().equals("COMPLETED");
      double toLat = toDropoff
          ? (trip.getDropoffLat() != null ? trip.getDropoffLat().doubleValue() : Double.NaN)
          : (trip.getPickupLat() != null ? trip.getPickupLat().doubleValue() : Double.NaN);
      double toLng = toDropoff
          ? (trip.getDropoffLng() != null ? trip.getDropoffLng().doubleValue() : Double.NaN)
          : (trip.getPickupLng() != null ? trip.getPickupLng().doubleValue() : Double.NaN);
      if (!Double.isNaN(fromLat) && !Double.isNaN(toLat)) {
        etaMinutes = Geo.etaMinutesForMiles(Geo.haversineMiles(fromLat, fromLng, toLat, toLng));
      }
    } catch (RuntimeException ignored) {
      // ETA is best-effort on the public page; a missing coordinate just
      // means no ETA instead of an error.
    }
    return new PublicTrackingResponse(
        trip.getCode(),
        trip.getStatus().name(),
        TripStatusMapper.toFrontend(trip.getStatus()),
        etaMinutes,
        driverFirstName,
        trip.getVehicle() == null ? null : trip.getVehicle().getLabel(),
        areaOf(trip.getPickupAddress()),
        areaOf(trip.getDropoffAddress()),
        trip.getScheduledAt(),
        token.getExpiresAt());
  }

  /** "500 E Hampden Ave, Englewood, CO" → "Englewood, CO" (area, not the street). */
  static String areaOf(String address) {
    if (address == null || address.isBlank()) {
      return null;
    }
    String[] parts = address.split(",");
    if (parts.length <= 1) {
      return null;
    }
    StringBuilder area = new StringBuilder();
    for (int i = 1; i < parts.length; i++) {
      if (area.length() > 0) {
        area.append(", ");
      }
      area.append(parts[i].trim());
    }
    return area.toString();
  }

  private TrackingLinkResponse toLinkResponse(TrackingToken token) {
    return new TrackingLinkResponse(
        token.getTrip().getCode(), token.getToken(),
        "/track/" + token.getToken(), token.getExpiresAt(),
        Map.of("note", "Share this link with the rider. It expires automatically; "
            + "it shows status + ETA only — no addresses, phone numbers or signatures."));
  }

  public record TrackingLinkResponse(
      String tripCode, String token, String path, Instant expiresAt,
      Map<String, String> meta) {}

  public record PublicTrackingResponse(
      String tripCode, String status, String frontendStatus,
      Integer etaMinutes, String driverFirstName, String vehicle,
      String pickupArea, String dropoffArea,
      Instant scheduledAt, Instant linkExpiresAt) {}
}
