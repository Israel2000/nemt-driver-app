package com.fleetos.api.trips;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.common.Geo;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.AuditEvent;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.domain.Role;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.domain.TripMessage;
import com.fleetos.api.domain.TripSecurement;
import com.fleetos.api.domain.TripStatus;
import com.fleetos.api.domain.TripStatusEvent;
import com.fleetos.api.domain.Vehicle;
import com.fleetos.api.drivers.EligibilityService;
import com.fleetos.api.repo.AuditEventRepository;
import com.fleetos.api.repo.DriverRepository;
import com.fleetos.api.repo.TripMessageRepository;
import com.fleetos.api.repo.TripRepository;
import com.fleetos.api.repo.TripSecurementRepository;
import com.fleetos.api.repo.TripStatusEventRepository;
import com.fleetos.api.repo.VehicleRepository;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Trips: workspace-scoped CRUD + lifecycle. Every method takes the
 * authenticated user and enforces scoping itself: a user only ever sees
 * their own workspace's data (cross-workspace access is a 404, so nothing
 * leaks), and a DRIVER only touches trips assigned to their driver record.
 */
@Service
public class TripService {

  /** ARRIVED proximity gate: >0.5 mi from pickup on a live fix needs confirm. */
  public static final double ARRIVAL_GATE_MILES = 0.5;

  private final TripRepository trips;
  private final DriverRepository drivers;
  private final VehicleRepository vehicles;
  private final TripStatusEventRepository statusEvents;
  private final TripSecurementRepository securements;
  private final TripMessageRepository messages;
  private final AuditEventRepository auditEvents;
  private final EligibilityService eligibility;

  public TripService(TripRepository trips, DriverRepository drivers,
      VehicleRepository vehicles, TripStatusEventRepository statusEvents,
      TripSecurementRepository securements, TripMessageRepository messages,
      AuditEventRepository auditEvents, EligibilityService eligibility) {
    this.trips = trips;
    this.drivers = drivers;
    this.vehicles = vehicles;
    this.statusEvents = statusEvents;
    this.securements = securements;
    this.messages = messages;
    this.auditEvents = auditEvents;
    this.eligibility = eligibility;
  }

  // ---------------------------------------------------------------- helpers

  public static void requireDispatcher(AppUser user) {
    if (user.getRole() != Role.ADMIN && user.getRole() != Role.DISPATCHER) {
      throw ApiException.forbidden("Only dispatchers and admins can do this");
    }
  }

  /** Resolve a trip by UUID or by its human code (TRP-101), workspace-scoped. */
  @Transactional(readOnly = true)
  public Trip resolveTrip(AppUser user, String idOrCode) {
    Optional<Trip> found = Optional.empty();
    try {
      found = trips.findById(UUID.fromString(idOrCode));
    } catch (IllegalArgumentException ignored) {
      // Not a UUID — fall through to code lookup.
    }
    if (found.isEmpty()) {
      found = trips.findByCode(idOrCode);
    }
    Trip trip = found.orElseThrow(() -> ApiException.notFound("Trip"));
    if (!trip.getWorkspace().getId().equals(user.getWorkspace().getId())) {
      throw ApiException.notFound("Trip");
    }
    return trip;
  }

  /** A driver may only act on trips assigned to their own driver record. */
  public void requireTripAccess(AppUser user, Trip trip) {
    if (user.getRole() == Role.DRIVER) {
      Driver driver = trip.getDriver();
      if (driver == null || driver.getUser() == null
          || !driver.getUser().getId().equals(user.getId())) {
        throw ApiException.notFound("Trip");
      }
    }
  }

  private Driver resolveDriver(AppUser user, String driverCode) {
    return drivers.findByDriverCode(driverCode)
        .filter(d -> d.getWorkspace().getId().equals(user.getWorkspace().getId()))
        .orElseThrow(() -> ApiException.notFound("Driver"));
  }

  private Vehicle resolveVehicle(AppUser user, String label) {
    if (label == null || label.isBlank()) {
      return null;
    }
    return vehicles.findByWorkspaceIdAndLabel(user.getWorkspace().getId(), label).orElse(null);
  }

  private String nextCode(AppUser user) {
    int max = 102;
    for (Trip t : trips.findByWorkspaceId(user.getWorkspace().getId())) {
      String code = t.getCode();
      if (code != null && code.startsWith("TRP-")) {
        try {
          max = Math.max(max, Integer.parseInt(code.substring(4)));
        } catch (NumberFormatException ignored) {
          // Non-numeric code — ignore for sequencing.
        }
      }
    }
    return "TRP-" + (max + 1);
  }

  private void audit(AppUser user, String action, String entityType, String entityId,
      BigDecimal lat, BigDecimal lng, String details) {
    AuditEvent event = new AuditEvent(user.getWorkspace(), user.getEmail(), action);
    event.setUser(user);
    event.setEntityType(entityType);
    event.setEntityId(entityId);
    event.setGpsLat(lat);
    event.setGpsLng(lng);
    event.setDetails(details);
    auditEvents.save(event);
  }

  private void recordStatusEvent(AppUser user, Trip trip, TripStatus status,
      BigDecimal lat, BigDecimal lng, String gpsSource,
      String byRole, String byName, String reasonCode, String reasonNote) {
    TripStatusEvent event = new TripStatusEvent(trip, user.getWorkspace(), status);
    event.setGpsLat(lat);
    event.setGpsLng(lng);
    event.setGpsSource(gpsSource == null ? "estimated" : gpsSource);
    event.setByRole(byRole);
    event.setByName(byName);
    event.setReasonCode(reasonCode);
    event.setReasonNote(reasonNote);
    statusEvents.save(event);
    audit(user, "TRIP_STATUS_" + status, "TRIP", trip.getCode(), lat, lng,
        (byName == null ? "" : byName + " → " + status)
            + (reasonCode == null ? "" : " — " + reasonCode)
            + (reasonNote == null ? "" : ": " + reasonNote));
  }

  public TripResponse toResponse(Trip trip) {
    SecurementResponse sec = securements.findByTripId(trip.getId())
        .map(s -> new SecurementResponse(
            s.isPositioned(), s.isTieDownFrontLeft(), s.isTieDownFrontRight(),
            s.isTieDownRearLeft(), s.isTieDownRearRight(), s.isBrakesSet(),
            s.isLapBelt(), s.isShoulderBelt(), s.isComplete(),
            s.getCompletedBy(), s.getCompletedAt()))
        .orElse(null);
    Driver driver = trip.getDriver();
    Vehicle vehicle = trip.getVehicle();
    return new TripResponse(
        trip.getId(), trip.getCode(), trip.getRiderName(), trip.getPatientPhone(),
        trip.getMobility(), trip.getPickupAddress(), trip.getPickupLat(), trip.getPickupLng(),
        trip.getDropoffAddress(), trip.getDropoffLat(), trip.getDropoffLng(),
        trip.getScheduledAt(), trip.getStatus().name(),
        TripStatusMapper.toFrontend(trip.getStatus()),
        driver == null ? null : driver.getDriverCode(),
        driver == null ? null : driver.displayName(),
        vehicle == null ? null : vehicle.getLabel(),
        trip.isWheelchair(), trip.getOdometerStart(), trip.getOdometerEnd(),
        trip.isPassengerSignature(), trip.isDriverSignature(), trip.isBillable(),
        trip.getSigneeName(), trip.getSigneeType(), trip.getCompletedAt(),
        trip.getGpsLat(), trip.getGpsLng(), sec,
        trip.getCreatedAt(), trip.getUpdatedAt());
  }

  // ------------------------------------------------------------------- reads

  @Transactional(readOnly = true)
  public List<TripResponse> listTrips(AppUser user, String status, String driverCode) {
    TripStatus filter = null;
    if (status != null && !status.isBlank()) {
      filter = TripStatusMapper.fromFrontend(status);
    }
    List<Trip> all = trips.findByWorkspaceId(user.getWorkspace().getId());
    if (user.getRole() == Role.DRIVER) {
      // Drivers see only their own assigned trips.
      all = all.stream()
          .filter(t -> t.getDriver() != null && t.getDriver().getUser() != null
              && t.getDriver().getUser().getId().equals(user.getId()))
          .toList();
    }
    List<TripResponse> out = new ArrayList<>();
    for (Trip t : all) {
      if (filter != null && t.getStatus() != filter) {
        continue;
      }
      if (driverCode != null && !driverCode.isBlank()
          && (t.getDriver() == null || !driverCode.equals(t.getDriver().getDriverCode()))) {
        continue;
      }
      out.add(toResponse(t));
    }
    return out;
  }

  @Transactional(readOnly = true)
  public TripResponse getTrip(AppUser user, String idOrCode) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    return toResponse(trip);
  }

  @Transactional(readOnly = true)
  public List<TripEventResponse> listEvents(AppUser user, String idOrCode) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    List<TripEventResponse> out = new ArrayList<>();
    for (TripStatusEvent e : statusEvents.findByTripIdOrderByCreatedAtAsc(trip.getId())) {
      out.add(new TripEventResponse(
          e.getId(), e.getStatus().name(), TripStatusMapper.toFrontend(e.getStatus()),
          e.getGpsLat(), e.getGpsLng(), e.getGpsSource(), e.getByRole(), e.getByName(),
          e.getReasonCode(), e.getReasonNote(), e.getCreatedAt()));
    }
    return out;
  }

  // ------------------------------------------------------------------ create

  @Transactional
  public TripResponse createTrip(AppUser user, CreateTripRequest req) {
    requireDispatcher(user);
    if (req.riderName() == null || req.riderName().isBlank()) {
      throw ApiException.badRequest("riderName is required");
    }
    Driver driver = null;
    if (req.driverCode() != null && !req.driverCode().isBlank()) {
      driver = resolveDriver(user, req.driverCode());
      EligibilityService.EligibilityResult check =
          eligibility.evaluate(user.getWorkspace(), driver);
      if (!check.eligible()) {
        throw new ApiException(403, "driver_blocked",
            "Driver " + driver.displayName() + " is blocked from dispatch",
            Map.of("driverId", driver.getDriverCode(), "reasons", check.lockoutReasons()));
      }
    }
    Vehicle vehicle = resolveVehicle(user, req.vehicleLabel());

    String code = req.code();
    if (code != null && !code.isBlank()) {
      if (trips.findByCode(code).isPresent()) {
        throw ApiException.conflict("Trip code already exists: " + code, Map.of("code", code));
      }
    } else {
      code = nextCode(user);
    }

    Trip trip = new Trip(code, user.getWorkspace());
    trip.setRiderName(req.riderName().trim());
    trip.setPatientPhone(req.patientPhone());
    trip.setMobility(req.mobility() == null || req.mobility().isBlank() ? "ambulatory" : req.mobility());
    trip.setPickupAddress(req.pickupAddress());
    trip.setPickupLat(req.pickupLat());
    trip.setPickupLng(req.pickupLng());
    trip.setDropoffAddress(req.dropoffAddress());
    trip.setDropoffLat(req.dropoffLat());
    trip.setDropoffLng(req.dropoffLng());
    trip.setScheduledAt(req.scheduledAt());
    trip.setDriver(driver);
    trip.setVehicle(vehicle);
    trip.setWheelchair(Boolean.TRUE.equals(req.wheelchair()));
    trip.setOdometerStart(req.odometerStart());
    trip.setStatus(TripStatus.ASSIGNED);
    trip = trips.save(trip);
    audit(user, "TRIP_CREATED", "TRIP", trip.getCode(), null, null,
        "Dispatch created " + trip.getCode() + " — " + trip.getRiderName()
            + (driver == null ? " (unassigned)" : " → " + driver.displayName()));
    return toResponse(trip);
  }

  @Transactional
  public TripResponse assignTrip(AppUser user, String idOrCode, AssignRequest req) {
    requireDispatcher(user);
    Trip trip = resolveTrip(user, idOrCode);
    Driver driver = null;
    if (req.driverCode() != null && !req.driverCode().isBlank()) {
      driver = resolveDriver(user, req.driverCode());
      EligibilityService.EligibilityResult check =
          eligibility.evaluate(user.getWorkspace(), driver);
      if (!check.eligible()) {
        throw new ApiException(403, "driver_blocked",
            "Driver " + driver.displayName() + " is blocked from dispatch",
            Map.of("driverId", driver.getDriverCode(), "reasons", check.lockoutReasons()));
      }
    }
    Vehicle vehicle = resolveVehicle(user, req.vehicleLabel());
    trip.setDriver(driver);
    if (req.vehicleLabel() != null) {
      trip.setVehicle(vehicle);
    }
    trip.setUpdatedAt(Instant.now());
    trip = trips.save(trip);
    audit(user, "TRIP_REASSIGNED", "TRIP", trip.getCode(), null, null,
        driver == null ? "Dispatch unassigned " + trip.getCode()
            : "Dispatch reassigned " + trip.getCode() + " → " + driver.displayName());
    return toResponse(trip);
  }

  // ------------------------------------------------------------ status changes

  @Transactional
  public TripResponse changeStatus(AppUser user, String idOrCode, StatusRequest req) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    TripStatus target = TripStatusMapper.fromFrontend(req.status());
    TripStatus current = trip.getStatus();
    if (target == current) {
      return toResponse(trip);
    }
    if (!TripStatusMapper.isLegal(current, target)) {
      throw ApiException.badRequest(
          "Illegal status transition: " + current + " → " + target);
    }

    String byRole = user.getRole() == Role.DRIVER ? "driver" : "dispatch";
    String byName = user.getFullName();

    // --- GPS: a supplied fix is used as-is; without one the fix is the
    // stop's known coordinates, honestly stamped 'estimated' — never faked.
    BigDecimal lat = req.lat();
    BigDecimal lng = req.lng();
    String gpsSource = req.gpsSource();
    if (lat == null || lng == null) {
      gpsSource = "estimated";
      if (target == TripStatus.ARRIVED || target == TripStatus.EN_ROUTE) {
        lat = trip.getPickupLat();
        lng = trip.getPickupLng();
      } else {
        lat = trip.getDropoffLat();
        lng = trip.getDropoffLng();
      }
    } else if (gpsSource == null || gpsSource.isBlank()) {
      gpsSource = "estimated";
    }

    // --- ARRIVED proximity gate (RouteGenie rule): a live fix >0.5 mi from
    // the pickup needs an explicit confirm to proceed.
    if (target == TripStatus.ARRIVED && trip.getPickupLat() != null && trip.getPickupLng() != null
        && req.lat() != null && req.lng() != null && !Boolean.TRUE.equals(req.confirm())) {
      double miles = Geo.haversineMiles(
          req.lat().doubleValue(), req.lng().doubleValue(),
          trip.getPickupLat().doubleValue(), trip.getPickupLng().doubleValue());
      if (miles > ARRIVAL_GATE_MILES) {
        throw ApiException.conflict(
            "Driver is " + String.format("%.2f", miles) + " miles from the pickup — confirm to proceed",
            Map.of("distanceMiles", miles,
                "pickupLat", trip.getPickupLat(),
                "pickupLng", trip.getPickupLng(),
                "requiresConfirm", true));
      }
    }

    // --- BOARDED gate: wheelchair trips need the full securement checklist.
    if (target == TripStatus.BOARDED && trip.isWheelchair()) {
      boolean secured = securements.findByTripId(trip.getId())
          .map(TripSecurement::isComplete).orElse(false);
      if (!secured) {
        throw ApiException.conflict(
            "Wheelchair securement checklist must be completed before boarding",
            Map.of("securementRequired", true));
      }
    }

    // --- COMPLETED gate: proof of delivery — odometer + both signatures.
    // Proof fields may ride along in this same request.
    if (target == TripStatus.COMPLETED) {
      applyProofFields(trip, req.odometerEnd(), req.passengerSignature(),
          req.passengerSignatureData(), req.driverSignature(), req.driverSignatureData(),
          req.driverSignatureName(), req.signeeName(), req.signeeType());
      List<String> missing = new ArrayList<>();
      if (trip.getOdometerEnd() == null) {
        missing.add("odometerEnd");
      }
      if (!trip.isPassengerSignature()) {
        missing.add("passengerSignature");
      }
      if (!trip.isDriverSignature()) {
        missing.add("driverSignature");
      }
      if (!missing.isEmpty()) {
        throw ApiException.conflict(
            "Proof of delivery incomplete — cannot complete trip",
            Map.of("missing", missing));
      }
      trip.setBillable(true);
      trip.setCompletedAt(Instant.now());
    }

    trip.setStatus(target);
    trip.setGpsLat(lat);
    trip.setGpsLng(lng);
    if (target == TripStatus.ARRIVED) {
      trip.setArrivedLat(lat);
      trip.setArrivedLng(lng);
    }
    trip.setUpdatedAt(Instant.now());
    trip = trips.save(trip);
    recordStatusEvent(user, trip, target, lat, lng, gpsSource, byRole, byName,
        req.reasonCode(), req.reasonNote());
    return toResponse(trip);
  }

  private void applyProofFields(Trip trip, Integer odometerEnd,
      Boolean passengerSignature, String passengerSignatureData,
      Boolean driverSignature, String driverSignatureData,
      String driverSignatureName, String signeeName, String signeeType) {
    if (odometerEnd != null) {
      trip.setOdometerEnd(odometerEnd);
    }
    if (Boolean.TRUE.equals(passengerSignature)) {
      trip.setPassengerSignature(true);
    }
    if (passengerSignatureData != null && !passengerSignatureData.isBlank()) {
      trip.setPassengerSignature(true);
      trip.setPassengerSignatureData(passengerSignatureData);
    }
    if (Boolean.TRUE.equals(driverSignature)) {
      trip.setDriverSignature(true);
    }
    if (driverSignatureData != null && !driverSignatureData.isBlank()) {
      trip.setDriverSignature(true);
      trip.setDriverSignatureData(driverSignatureData);
    }
    if (signeeName != null) {
      trip.setSigneeName(signeeName);
    }
    if (signeeType != null) {
      trip.setSigneeType(signeeType);
    }
  }

  // -------------------------------------------------------------- securement

  @Transactional
  public SecurementResponse saveSecurement(AppUser user, String idOrCode, SecurementRequest req) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    TripSecurement sec = securements.findByTripId(trip.getId())
        .orElseGet(() -> new TripSecurement(trip, user.getWorkspace()));
    sec.setPositioned(Boolean.TRUE.equals(req.positioned()));
    sec.setTieDownFrontLeft(Boolean.TRUE.equals(req.tieDownFrontLeft()));
    sec.setTieDownFrontRight(Boolean.TRUE.equals(req.tieDownFrontRight()));
    sec.setTieDownRearLeft(Boolean.TRUE.equals(req.tieDownRearLeft()));
    sec.setTieDownRearRight(Boolean.TRUE.equals(req.tieDownRearRight()));
    sec.setBrakesSet(Boolean.TRUE.equals(req.brakesSet()));
    sec.setLapBelt(Boolean.TRUE.equals(req.lapBelt()));
    sec.setShoulderBelt(Boolean.TRUE.equals(req.shoulderBelt()));
    sec.setCompletedBy(req.completedBy() == null ? user.getFullName() : req.completedBy());
    sec.setCompletedAt(Instant.now());
    sec = securements.save(sec);
    audit(user, "SECUREMENT_COMPLETED", "TRIP", trip.getCode(), null, null,
        "Wheelchair securement " + (sec.isComplete() ? "completed" : "saved (incomplete)")
            + " on " + trip.getCode());
    return new SecurementResponse(
        sec.isPositioned(), sec.isTieDownFrontLeft(), sec.isTieDownFrontRight(),
        sec.isTieDownRearLeft(), sec.isTieDownRearRight(), sec.isBrakesSet(),
        sec.isLapBelt(), sec.isShoulderBelt(), sec.isComplete(),
        sec.getCompletedBy(), sec.getCompletedAt());
  }

  // -------------------------------------------------------------------- proof

  @Transactional
  public TripResponse saveProof(AppUser user, String idOrCode, ProofRequest req) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    applyProofFields(trip, req.odometerEnd(), req.passengerSignature(),
        req.passengerSignatureData(), req.driverSignature(), req.driverSignatureData(),
        req.driverSignatureName(), req.signeeName(), req.signeeType());
    if (trip.getOdometerEnd() != null && trip.isPassengerSignature() && trip.isDriverSignature()) {
      trip.setBillable(true);
    }
    trip.setUpdatedAt(Instant.now());
    trip = trips.save(trip);
    audit(user, "PROOF_ATTACHED", "TRIP", trip.getCode(), null, null,
        "Proof of delivery attached to " + trip.getCode()
            + (trip.isBillable() ? " — billable" : " — incomplete"));
    return toResponse(trip);
  }

  // ----------------------------------------------------------------- messages

  @Transactional(readOnly = true)
  public List<MessageResponse> listMessages(AppUser user, String idOrCode) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    List<MessageResponse> out = new ArrayList<>();
    for (TripMessage m : messages.findByTripIdOrderByCreatedAtAsc(trip.getId())) {
      out.add(new MessageResponse(
          m.getId(), trip.getCode(), m.getSenderRole(), m.getSenderName(),
          m.getBody(), m.getCreatedAt()));
    }
    return out;
  }

  @Transactional
  public MessageResponse postMessage(AppUser user, String idOrCode, MessageRequest req) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    if (req.body() == null || req.body().isBlank()) {
      throw ApiException.badRequest("Message body is required");
    }
    String senderRole = user.getRole() == Role.DRIVER ? "driver" : "dispatch";
    String senderName = req.fromName() == null || req.fromName().isBlank()
        ? user.getFullName() : req.fromName();
    TripMessage message = new TripMessage(trip, user.getWorkspace(), senderRole, senderName, req.body().trim());
    message.setSenderUser(user);
    message = messages.save(message);
    audit(user, "MESSAGE_SENT", "TRIP", trip.getCode(), null, null,
        senderName + " messaged on " + trip.getCode());
    return new MessageResponse(
        message.getId(), trip.getCode(), message.getSenderRole(),
        message.getSenderName(), message.getBody(), message.getCreatedAt());
  }

  // ---------------------------------------------------------------------- ETA

  @Transactional(readOnly = true)
  public EtaResponse eta(AppUser user, String idOrCode, String to) {
    Trip trip = resolveTrip(user, idOrCode);
    requireTripAccess(user, trip);
    boolean toDropoff = !"pickup".equalsIgnoreCase(to);
    BigDecimal fromLat = trip.getGpsLat() != null ? trip.getGpsLat() : trip.getPickupLat();
    BigDecimal fromLng = trip.getGpsLng() != null ? trip.getGpsLng() : trip.getPickupLng();
    BigDecimal toLat = toDropoff ? trip.getDropoffLat() : trip.getPickupLat();
    BigDecimal toLng = toDropoff ? trip.getDropoffLng() : trip.getPickupLng();
    if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
      throw ApiException.badRequest("Cannot compute ETA — trip is missing coordinates");
    }
    double miles = Geo.haversineMiles(
        fromLat.doubleValue(), fromLng.doubleValue(),
        toLat.doubleValue(), toLng.doubleValue());
    return new EtaResponse(
        trip.getCode(), toDropoff ? "dropoff" : "pickup", miles,
        Geo.etaMinutesForMiles(miles), true,
        "Haversine distance at an assumed 30 mph — an estimate, not live traffic");
  }
}
