package com.fleetos.api.compliance;

import com.fleetos.api.compliance.ComplianceService.BatchResult;
import com.fleetos.api.compliance.ComplianceService.CheckView;
import com.fleetos.api.compliance.ComplianceService.ComplianceView;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.ComplianceCheck;
import java.util.Map;
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
 * Driver OIG / SAM / MVR compliance. Checks are recorded as SIMULATED or
 * MANUAL — never a live federal lookup (see ComplianceService). The Audit
 * Shield "Run OIG/SAM Scan" button calls the batch endpoint.
 */
@RestController
@RequestMapping("/api/drivers")
public class ComplianceController {

  private final ComplianceService complianceService;

  public ComplianceController(ComplianceService complianceService) {
    this.complianceService = complianceService;
  }

  /** Full compliance view: OIG/SAM/MVR fields + credentials + check history. */
  @GetMapping("/{id}/compliance")
  public ComplianceView view(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return complianceService.view(user, id);
  }

  /** Record one check run for one driver (SIMULATED by default). */
  @PostMapping("/{id}/compliance/run-check")
  public ResponseEntity<CheckView> runCheck(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestBody(required = false) Map<String, String> body) {
    ComplianceCheck check = complianceService.runCheck(user, id,
        body == null ? null : body.get("checkType"),
        body == null ? null : body.get("result"),
        body == null ? null : body.get("source"),
        body == null ? null : body.get("note"));
    return ResponseEntity.status(HttpStatus.CREATED).body(new CheckView(
        check.getId(), check.getCheckType(), check.getResult(),
        check.getSource(), check.getNote(), check.getCheckedAt()));
  }

  /** Batch run for every driver in the workspace (Audit Shield scan button). */
  @PostMapping("/compliance/run-check")
  public BatchResult runBatch(
      @AuthenticationPrincipal AppUser user,
      @RequestBody(required = false) Map<String, String> body) {
    return complianceService.runBatch(user,
        body == null ? null : body.get("checkType"));
  }
}
