package com.fleetos.api.drivers;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Credential;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.drivers.DriverDtos.CredentialResponse;
import com.fleetos.api.drivers.DriverDtos.UpdateCredentialRequest;
import com.fleetos.api.repo.CredentialRepository;
import com.fleetos.api.repo.DriverRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Credential renewals: PUT /api/credentials/{id} (dispatch/admin only). */
@RestController
@RequestMapping("/api/credentials")
public class CredentialController {

  private final CredentialRepository credentials;
  private final DriverRepository drivers;

  public CredentialController(CredentialRepository credentials, DriverRepository drivers) {
    this.credentials = credentials;
    this.drivers = drivers;
  }

  @PutMapping("/{credentialId}")
  public CredentialResponse updateCredential(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID credentialId,
      @RequestBody UpdateCredentialRequest req) {
    com.fleetos.api.trips.TripService.requireDispatcher(user);
    Credential credential = credentials.findById(credentialId)
        .orElseThrow(() -> ApiException.notFound("Credential"));
    Driver driver = credential.getDriver();
    if (!driver.getWorkspace().getId().equals(user.getWorkspace().getId())) {
      throw ApiException.notFound("Credential");
    }
    if (req.type() != null && !req.type().isBlank()) {
      credential.setType(req.type().trim());
    }
    if (req.expiresAt() != null) {
      credential.setExpiresAt(req.expiresAt());
      if ("LICENSE".equalsIgnoreCase(credential.getType())) {
        driver.setLicenseExpiresAt(req.expiresAt());
        drivers.save(driver);
      }
    }
    credential.setStatus(EligibilityService.statusFor(credential.getExpiresAt(), LocalDate.now()));
    credential = credentials.save(credential);
    return new CredentialResponse(
        credential.getId(), credential.getType(), credential.getExpiresAt(),
        credential.getStatus(),
        EligibilityService.daysLeft(credential.getExpiresAt(), LocalDate.now()));
  }
}
