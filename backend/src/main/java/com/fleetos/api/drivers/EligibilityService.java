package com.fleetos.api.drivers;

import com.fleetos.api.domain.Credential;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.domain.Workspace;
import com.fleetos.api.repo.CredentialRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Server-side DQF (Driver Qualification File) eligibility — the same rule
 * the frontend's evaluateDispatchEligibility uses, enforced here so dispatch
 * cannot be bypassed from the client:
 * <ul>
 *   <li>any credential (or the licence) past expiry → lockout reason</li>
 *   <li>expiring within 30 days → warning reason</li>
 *   <li>when the workspace DQF hard lockout is ON (default), lockout reasons
 *       make the driver ineligible; when OFF, they only warn</li>
 * </ul>
 * OIG/SAM and MVR checks from the frontend rule are not modelled yet —
 * the backend has no OIG/MVR fields (Phase 3).
 */
@Service
public class EligibilityService {

  /** Days before expiry a credential counts as "expiring soon". */
  public static final int WARNING_DAYS = 30;

  private final CredentialRepository credentials;

  public EligibilityService(CredentialRepository credentials) {
    this.credentials = credentials;
  }

  public record CredentialView(
      UUID id, String type, LocalDate expiresAt, String status, Long daysLeft) {}

  public record EligibilityResult(
      String driverId,
      String driverName,
      boolean eligible,
      boolean lockoutEnabled,
      String dqfStatus,
      Long daysLeft,
      List<String> lockoutReasons,
      List<String> warningReasons,
      String evaluatedAt) {}

  /** Live status from an expiry date: EXPIRED / WARNING / VALID. */
  public static String statusFor(LocalDate expiresAt, LocalDate today) {
    if (expiresAt == null) {
      return "VALID";
    }
    if (expiresAt.isBefore(today)) {
      return "EXPIRED";
    }
    if (!expiresAt.isAfter(today.plusDays(WARNING_DAYS))) {
      return "WARNING";
    }
    return "VALID";
  }

  public static Long daysLeft(LocalDate expiresAt, LocalDate today) {
    return expiresAt == null ? null : ChronoUnit.DAYS.between(today, expiresAt);
  }

  /** Worst credential status across the driver's file + licence. */
  public String dqfStatusFor(Driver driver) {
    LocalDate today = LocalDate.now();
    String worst = "VALID";
    if ("EXPIRED".equals(statusFor(driver.getLicenseExpiresAt(), today))) {
      return "EXPIRED";
    }
    if ("WARNING".equals(statusFor(driver.getLicenseExpiresAt(), today))) {
      worst = "WARNING";
    }
    for (Credential c : credentials.findByDriverId(driver.getId())) {
      String s = statusFor(c.getExpiresAt(), today);
      if ("EXPIRED".equals(s)) {
        return "EXPIRED";
      }
      if ("WARNING".equals(s)) {
        worst = "WARNING";
      }
    }
    return worst;
  }

  /** Full credential list with live-computed status + days-left. */
  public List<CredentialView> credentialViews(Driver driver) {
    LocalDate today = LocalDate.now();
    List<CredentialView> views = new ArrayList<>();
    for (Credential c : credentials.findByDriverId(driver.getId())) {
      views.add(new CredentialView(
          c.getId(), c.getType(), c.getExpiresAt(),
          statusFor(c.getExpiresAt(), today), daysLeft(c.getExpiresAt(), today)));
    }
    return views;
  }

  public EligibilityResult evaluate(Workspace workspace, Driver driver) {
    LocalDate today = LocalDate.now();
    List<String> lockoutReasons = new ArrayList<>();
    List<String> warningReasons = new ArrayList<>();

    String licStatus = statusFor(driver.getLicenseExpiresAt(), today);
    if ("EXPIRED".equals(licStatus)) {
      lockoutReasons.add("Driver's license expired on " + driver.getLicenseExpiresAt());
    } else if ("WARNING".equals(licStatus)) {
      warningReasons.add("Driver's license expires within 30 days (" + driver.getLicenseExpiresAt() + ")");
    }

    Long minDaysLeft = daysLeft(driver.getLicenseExpiresAt(), today);
    for (Credential c : credentials.findByDriverId(driver.getId())) {
      String s = statusFor(c.getExpiresAt(), today);
      Long d = daysLeft(c.getExpiresAt(), today);
      if (d != null && (minDaysLeft == null || d < minDaysLeft)) {
        minDaysLeft = d;
      }
      if ("EXPIRED".equals(s)) {
        lockoutReasons.add(c.getType() + " expired on " + c.getExpiresAt());
      } else if ("WARNING".equals(s)) {
        warningReasons.add(c.getType() + " expires soon (" + c.getExpiresAt() + ")");
      }
    }

    boolean lockoutEnabled = workspace.isDqfLockoutEnabled();
    boolean eligible = !lockoutEnabled || lockoutReasons.isEmpty();
    if (!lockoutEnabled && !lockoutReasons.isEmpty()) {
      // Lockout OFF: expired items warn instead of blocking.
      warningReasons.addAll(0, lockoutReasons);
      lockoutReasons = List.of();
    }

    String dqfStatus = "VALID";
    if (!lockoutReasons.isEmpty()) {
      dqfStatus = "EXPIRED";
    } else if (!warningReasons.isEmpty()) {
      dqfStatus = "WARNING";
    }

    return new EligibilityResult(
        driver.getDriverCode(), driver.displayName(), eligible, lockoutEnabled,
        dqfStatus, minDaysLeft, lockoutReasons, warningReasons,
        java.time.Instant.now().toString());
  }
}
