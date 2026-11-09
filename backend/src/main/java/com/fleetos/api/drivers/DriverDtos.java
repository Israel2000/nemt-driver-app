package com.fleetos.api.drivers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Driver / DQF response shapes. */
public final class DriverDtos {

  private DriverDtos() {}

  public record DriverResponse(
      UUID id,
      String driverCode,
      String fullName,
      String dqfId,
      String licenseNumber,
      LocalDate licenseExpiresAt,
      String phone,
      String dqfStatus,
      Long daysLeft) {}

  public record CredentialResponse(
      UUID id,
      String type,
      LocalDate expiresAt,
      String status,
      Long daysLeft) {}

  public record DqfResponse(
      String driverId,
      String driverName,
      String dqfId,
      String dqfStatus,
      Long daysLeft,
      List<CredentialResponse> credentials) {}

  public record CreateCredentialRequest(String type, LocalDate expiresAt) {}

  public record UpdateCredentialRequest(String type, LocalDate expiresAt) {}
}
