package com.fleetos.api.compliance;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.ComplianceCheck;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.domain.Role;
import com.fleetos.api.drivers.EligibilityService;
import com.fleetos.api.repo.ComplianceCheckRepository;
import com.fleetos.api.repo.CredentialRepository;
import com.fleetos.api.repo.DriverRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Driver OIG / SAM / MVR compliance, server-side.
 *
 * <p><b>Honest boundary:</b> there is no live federal lookup here. The
 * HHS OIG LEIE and SAM.gov exclusion lists have no free public API the app
 * can call, and no credentials exist. A "check run" therefore records a
 * SIMULATED result (the run itself is stored with its timestamp, source
 * and outcome) or a MANUAL result the admin enters after doing their own
 * lookup. Every response carries {@code source} and a disclaimer so the
 * UI can never present it as a live federal verification. Going live
 * means: subscribe to a screening vendor (or the OIG's downloadable LEIE
 * file) and replace {@link #runCheck} with a real lookup.
 */
@Service
public class ComplianceService {

  public static final String SOURCE_SIMULATED = "SIMULATED";
  public static final String SOURCE_MANUAL = "MANUAL";

  private final DriverRepository drivers;
  private final CredentialRepository credentials;
  private final ComplianceCheckRepository checks;
  private final EligibilityService eligibility;

  public ComplianceService(DriverRepository drivers, CredentialRepository credentials,
      ComplianceCheckRepository checks, EligibilityService eligibility) {
    this.drivers = drivers;
    this.credentials = credentials;
    this.checks = checks;
    this.eligibility = eligibility;
  }

  public static void requireDispatcher(AppUser user) {
    if (user.getRole() != Role.ADMIN && user.getRole() != Role.DISPATCHER) {
      throw ApiException.forbidden("Only dispatchers and admins can do this");
    }
  }

  @Transactional(readOnly = true)
  public Driver resolveDriver(AppUser user, String idOrCode) {
    Driver driver = drivers.findByDriverCode(idOrCode).orElse(null);
    if (driver == null) {
      try {
        driver = drivers.findById(java.util.UUID.fromString(idOrCode)).orElse(null);
      } catch (IllegalArgumentException ignored) {
        // Not a UUID — stays null.
      }
    }
    if (driver == null || !driver.getWorkspace().getId().equals(user.getWorkspace().getId())) {
      throw ApiException.notFound("Driver");
    }
    return driver;
  }

  @Transactional(readOnly = true)
  public ComplianceView view(AppUser user, String idOrCode) {
    Driver driver = resolveDriver(user, idOrCode);
    return toView(driver);
  }

  private ComplianceView toView(Driver driver) {
    List<EligibilityService.CredentialView> creds = credentials.findByDriverId(driver.getId())
        .stream()
        .map(c -> new EligibilityService.CredentialView(
            c.getId(), c.getType(), c.getExpiresAt(),
            EligibilityService.statusFor(c.getExpiresAt(), java.time.LocalDate.now()),
            EligibilityService.daysLeft(c.getExpiresAt(), java.time.LocalDate.now())))
        .toList();
    List<CheckView> history = checks.findByDriverIdOrderByCheckedAtDesc(driver.getId())
        .stream()
        .map(c -> new CheckView(c.getId(), c.getCheckType(), c.getResult(), c.getSource(),
            c.getNote(), c.getCheckedAt()))
        .toList();
    return new ComplianceView(
        driver.getDriverCode(), driver.displayName(),
        driver.getOigStatus(), driver.getOigLastChecked(),
        driver.getSamStatus(), driver.getSamLastChecked(),
        driver.getMvrStatus(), driver.getMvrLastChecked(),
        creds, history,
        "OIG/SAM/MVR checks are recorded as SIMULATED or MANUAL — not live federal lookups.");
  }

  /**
   * Record one check run for one driver. Without a live lookup the run is
   * SIMULATED (result CLEAR unless the caller supplies FLAG + a note) or
   * MANUAL (the admin enters the outcome of their own lookup). The result
   * is stored on the driver and in the check history.
   */
  @Transactional
  public ComplianceCheck runCheck(AppUser user, String idOrCode, String checkType,
      String result, String source, String note) {
    requireDispatcher(user);
    Driver driver = resolveDriver(user, idOrCode);
    String type = checkType == null ? "OIG" : checkType.trim().toUpperCase();
    if (!List.of("OIG", "SAM", "MVR").contains(type)) {
      throw ApiException.badRequest("checkType must be OIG, SAM or MVR");
    }
    String src = source == null ? SOURCE_SIMULATED : source.trim().toUpperCase();
    if (!List.of(SOURCE_SIMULATED, SOURCE_MANUAL).contains(src)) {
      throw ApiException.badRequest("source must be SIMULATED or MANUAL");
    }
    String res = result == null ? "CLEAR" : result.trim().toUpperCase();
    if (!List.of("CLEAR", "FLAG").contains(res)) {
      throw ApiException.badRequest("result must be CLEAR or FLAG");
    }
    Instant now = Instant.now();
    switch (type) {
      case "OIG" -> { driver.setOigStatus(res); driver.setOigLastChecked(now); }
      case "SAM" -> { driver.setSamStatus(res); driver.setSamLastChecked(now); }
      case "MVR" -> { driver.setMvrStatus(res); driver.setMvrLastChecked(now); }
    }
    drivers.save(driver);
    String fullNote = (SOURCE_SIMULATED.equals(src)
        ? "Simulated check run — no live federal lookup was performed. "
        : "Manual entry — outcome recorded by " + user.getFullName() + " after their own lookup. ")
        + (note == null ? "" : note);
    ComplianceCheck check = new ComplianceCheck(
        user.getWorkspace(), driver, type, res, src, fullNote, user);
    return checks.save(check);
  }

  /** Batch run for every driver in the workspace (the Audit Shield scan button). */
  @Transactional
  public BatchResult runBatch(AppUser user, String checkType) {
    requireDispatcher(user);
    String type = checkType == null ? "OIG" : checkType.trim().toUpperCase();
    if (!List.of("OIG", "SAM", "MVR").contains(type)) {
      throw ApiException.badRequest("checkType must be OIG, SAM or MVR");
    }
    int scanned = 0;
    int cleared = 0;
    int flagged = 0;
    for (Driver driver : drivers.findByWorkspaceId(user.getWorkspace().getId())) {
      runCheck(user, driver.getDriverCode(), type, "CLEAR", SOURCE_SIMULATED,
          "Batch " + type + " scan (simulated).");
      scanned++;
      cleared++;
    }
    return new BatchResult(type, scanned, cleared, flagged, SOURCE_SIMULATED,
        "Simulated batch run — no live federal lookup was performed.");
  }

  public record CheckView(
      java.util.UUID id, String checkType, String result, String source,
      String note, Instant checkedAt) {}

  public record ComplianceView(
      String driverCode, String driverName,
      String oigStatus, Instant oigLastChecked,
      String samStatus, Instant samLastChecked,
      String mvrStatus, Instant mvrLastChecked,
      List<EligibilityService.CredentialView> credentials,
      List<CheckView> history,
      String disclaimer) {}

  public record BatchResult(
      String checkType, int scannedCount, int clearedCount, int flaggedCount,
      String source, String disclaimer) {}
}
