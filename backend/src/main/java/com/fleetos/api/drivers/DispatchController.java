package com.fleetos.api.drivers;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.drivers.EligibilityService.EligibilityResult;
import com.fleetos.api.repo.DriverRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dispatch-side checks. GET /api/dispatch/eligibility?driverId=DRV-103 runs
 * the same rule POST /api/trips enforces — the frontend's Quick Dispatch
 * calls this before creating a trip, and the server re-checks on create.
 */
@RestController
@RequestMapping("/api/dispatch")
public class DispatchController {

  private final DriverRepository drivers;
  private final EligibilityService eligibility;

  public DispatchController(DriverRepository drivers, EligibilityService eligibility) {
    this.drivers = drivers;
    this.eligibility = eligibility;
  }

  @GetMapping("/eligibility")
  public EligibilityResult eligibility(
      @AuthenticationPrincipal AppUser user, @RequestParam String driverId) {
    Driver driver = drivers.findByDriverCode(driverId)
        .filter(d -> d.getWorkspace().getId().equals(user.getWorkspace().getId()))
        .orElseThrow(() -> ApiException.notFound("Driver"));
    return eligibility.evaluate(user.getWorkspace(), driver);
  }
}
