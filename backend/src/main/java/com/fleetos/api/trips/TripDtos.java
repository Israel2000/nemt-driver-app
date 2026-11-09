package com.fleetos.api.trips;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Request/response shapes for the Trips API. */
public final class TripDtos {

  private TripDtos() {}

  /** Full trip as returned by the API (frontend maps it to its Trip model). */
  public record TripResponse(
      UUID id,
      String code,
      String riderName,
      String patientPhone,
      String mobility,
      String pickupAddress,
      BigDecimal pickupLat,
      BigDecimal pickupLng,
      String dropoffAddress,
      BigDecimal dropoffLat,
      BigDecimal dropoffLng,
      Instant scheduledAt,
      String status,
      String frontendStatus,
      String driverId,
      String driverName,
      String vehicleNumber,
      boolean wheelchair,
      Integer odometerStart,
      Integer odometerEnd,
      boolean passengerSignature,
      boolean driverSignature,
      boolean billable,
      String signeeName,
      String signeeType,
      Instant completedAt,
      BigDecimal currentLat,
      BigDecimal currentLng,
      SecurementResponse securement,
      Instant createdAt,
      Instant updatedAt) {}

  public record SecurementResponse(
      boolean positioned,
      boolean tieDownFrontLeft,
      boolean tieDownFrontRight,
      boolean tieDownRearLeft,
      boolean tieDownRearRight,
      boolean brakesSet,
      boolean lapBelt,
      boolean shoulderBelt,
      boolean complete,
      String completedBy,
      Instant completedAt) {}

  public record CreateTripRequest(
      String code,
      String riderName,
      String patientPhone,
      String mobility,
      String pickupAddress,
      BigDecimal pickupLat,
      BigDecimal pickupLng,
      String dropoffAddress,
      BigDecimal dropoffLat,
      BigDecimal dropoffLng,
      Instant scheduledAt,
      String driverCode,
      String vehicleLabel,
      Boolean wheelchair,
      Integer odometerStart) {}

  public record AssignRequest(String driverCode, String vehicleLabel) {}

  public record StatusRequest(
      String status,
      BigDecimal lat,
      BigDecimal lng,
      String gpsSource,
      String reasonCode,
      String reasonNote,
      Boolean confirm,
      Integer odometerEnd,
      Boolean passengerSignature,
      String passengerSignatureData,
      Boolean driverSignature,
      String driverSignatureData,
      String driverSignatureName,
      String signeeName,
      String signeeType) {}

  public record SecurementRequest(
      Boolean positioned,
      Boolean tieDownFrontLeft,
      Boolean tieDownFrontRight,
      Boolean tieDownRearLeft,
      Boolean tieDownRearRight,
      Boolean brakesSet,
      Boolean lapBelt,
      Boolean shoulderBelt,
      String completedBy) {}

  public record ProofRequest(
      Integer odometerEnd,
      Boolean passengerSignature,
      String passengerSignatureData,
      Boolean driverSignature,
      String driverSignatureData,
      String driverSignatureName,
      String signeeName,
      String signeeType) {}

  public record MessageRequest(String body, String fromName) {}

  public record MessageResponse(
      UUID id,
      String tripId,
      String senderRole,
      String senderName,
      String body,
      Instant createdAt) {}

  public record TripEventResponse(
      UUID id,
      String status,
      String frontendStatus,
      BigDecimal lat,
      BigDecimal lng,
      String gpsSource,
      String byRole,
      String byName,
      String reasonCode,
      String reasonNote,
      Instant createdAt) {}

  public record EtaResponse(
      String tripId,
      String to,
      double miles,
      int minutes,
      boolean estimate,
      String basis) {}
}
