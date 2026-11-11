package com.fleetos.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * One recorded OIG / SAM / MVR compliance check for a driver.
 * `source` is SIMULATED or MANUAL — a check is never a live federal
 * lookup unless a real exclusion-database API is wired in. The stored
 * result is the outcome the admin recorded (or the simulated run
 * produced), labelled honestly wherever it is shown.
 */
@Entity
@Table(name = "compliance_checks")
public class ComplianceCheck {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "driver_id", nullable = false)
  private Driver driver;

  /** OIG | SAM | MVR */
  @Column(name = "check_type", nullable = false)
  private String checkType;

  /** CLEAR | FLAG */
  @Column(name = "result", nullable = false)
  private String result;

  /** SIMULATED | MANUAL */
  @Column(name = "source", nullable = false)
  private String source = "SIMULATED";

  @Column(name = "note", columnDefinition = "TEXT")
  private String note;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "checked_by_user_id")
  private AppUser checkedBy;

  @Column(name = "checked_at", nullable = false)
  private Instant checkedAt = Instant.now();

  protected ComplianceCheck() {}

  public ComplianceCheck(Workspace workspace, Driver driver, String checkType,
      String result, String source, String note, AppUser checkedBy) {
    this.workspace = workspace;
    this.driver = driver;
    this.checkType = checkType;
    this.result = result;
    this.source = source;
    this.note = note;
    this.checkedBy = checkedBy;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public Driver getDriver() { return driver; }
  public String getCheckType() { return checkType; }
  public String getResult() { return result; }
  public String getSource() { return source; }
  public String getNote() { return note; }
  public AppUser getCheckedBy() { return checkedBy; }
  public Instant getCheckedAt() { return checkedAt; }
}
