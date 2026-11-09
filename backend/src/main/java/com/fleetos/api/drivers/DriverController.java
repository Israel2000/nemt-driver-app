package com.fleetos.api.drivers;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Credential;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.drivers.DriverDtos.CreateCredentialRequest;
import com.fleetos.api.drivers.DriverDtos.CredentialResponse;
import com.fleetos.api.drivers.DriverDtos.DriverResponse;
import com.fleetos.api.drivers.DriverDtos.DqfResponse;
import com.fleetos.api.drivers.EligibilityService.CredentialView;
import com.fleetos.api.drivers.EligibilityService.EligibilityResult;
import com.fleetos.api.repo.CredentialRepository;
import com.fleetos.api.repo.DriverRepository;
import java.time.LocalDate;
import java.util.ArrayList;
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
import org.springframework.web.bind.annotation.RestController;

/**
 * Drivers + DQF. Workspace-scoped; drivers see only their own record,
 * dispatch/admin see the whole roster. DQF status is computed live from
 * expiry dates (never trusted from the stored denormalised column alone).
 */
@RestController
@RequestMapping("/api/drivers")
public class DriverController {

  private final DriverRepository drivers;
  private final CredentialRepository credentials;
  private final EligibilityService eligibility;

  public DriverController(DriverRepository drivers, CredentialRepository credentials,
      EligibilityService eligibility) {
    this.drivers = drivers;
    this.credentials = credentials;
    this.eligibility = eligibility;
  }

  private Driver resolve(AppUser user, String idOrCode) {
    Driver driver = null;
    try {
      driver = drivers.findById(UUID.fromString(idOrCode)).orElse(null);
    } catch (IllegalArgumentException ignored) {
      // Not a UUID — fall through to code lookup.
    }
    if (driver == null) {
      driver = drivers.findByDriverCode(idOrCode).orElse(null);
    }
    if (driver == null || !driver.getWorkspace().getId().equals(user.getWorkspace().getId())) {
      throw ApiException.notFound("Driver");
    }
    if (user.getRole() == com.fleetos.api.domain.Role.DRIVER
        && (driver.getUser() == null || !driver.getUser().getId().equals(user.getId()))) {
      throw ApiException.notFound("Driver");
    }
    return driver;
  }

  private DriverResponse toResponse(Driver driver) {
    String dqfStatus = eligibility.dqfStatusFor(driver);
    LocalDate today = LocalDate.now();
    Long daysLeft = EligibilityService.daysLeft(driver.getLicenseExpiresAt(), today);
    for (CredentialView v : eligibility.credentialViews(driver)) {
      if (v.daysLeft() != null && (daysLeft == null || v.daysLeft() < daysLeft)) {
        daysLeft = v.daysLeft();
      }
    }
    return new DriverResponse(
        driver.getId(), driver.getDriverCode(), driver.displayName(), driver.getDqfId(),
        driver.getLicenseNumber(), driver.getLicenseExpiresAt(), driver.getPhone(),
        dqfStatus, daysLeft);
  }

  @GetMapping
  public List<DriverResponse> list(@AuthenticationPrincipal AppUser user) {
    List<Driver> all = drivers.findByWorkspaceId(user.getWorkspace().getId());
    List<DriverResponse> out = new ArrayList<>();
    for (Driver d : all) {
      if (user.getRole() == com.fleetos.api.domain.Role.DRIVER
          && (d.getUser() == null || !d.getUser().getId().equals(user.getId()))) {
        continue;
      }
      out.add(toResponse(d));
    }
    return out;
  }

  @GetMapping("/{id}")
  public DriverResponse get(@AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return toResponse(resolve(user, id));
  }

  @GetMapping("/{id}/dqf")
  public DqfResponse dqf(@AuthenticationPrincipal AppUser user, @PathVariable String id) {
    Driver driver = resolve(user, id);
    List<CredentialResponse> creds = new ArrayList<>();
    for (CredentialView v : eligibility.credentialViews(driver)) {
      creds.add(new CredentialResponse(v.id(), v.type(), v.expiresAt(), v.status(), v.daysLeft()));
    }
    return new DqfResponse(
        driver.getDriverCode(), driver.displayName(), driver.getDqfId(),
        eligibility.dqfStatusFor(driver),
        creds.stream().map(CredentialResponse::daysLeft)
            .filter(d -> d != null).min(Long::compareTo).orElse(null),
        creds);
  }

  @PostMapping("/{id}/credentials")
  public ResponseEntity<CredentialResponse> addCredential(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody CreateCredentialRequest req) {
    com.fleetos.api.trips.TripService.requireDispatcher(user);
    Driver driver = resolve(user, id);
    if (req.type() == null || req.type().isBlank()) {
      throw ApiException.badRequest("type is required");
    }
    String status = EligibilityService.statusFor(req.expiresAt(), LocalDate.now());
    Credential credential = new Credential(driver, req.type().trim(), req.expiresAt(), status);
    credential = credentials.save(credential);
    if ("LICENSE".equalsIgnoreCase(req.type()) && req.expiresAt() != null) {
      driver.setLicenseExpiresAt(req.expiresAt());
      drivers.save(driver);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(new CredentialResponse(
        credential.getId(), credential.getType(), credential.getExpiresAt(),
        credential.getStatus(),
        EligibilityService.daysLeft(credential.getExpiresAt(), LocalDate.now())));
  }

  /** Dispatch-side eligibility check for one driver (same rule as POST /api/trips). */
  @GetMapping("/{id}/eligibility")
  public EligibilityResult eligibility(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    Driver driver = resolve(user, id);
    return eligibility.evaluate(user.getWorkspace(), driver);
  }
}
