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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "drivers")
public class Driver {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  /** Human code used by the frontend, e.g. DRV-101. */
  @Column(name = "driver_code", nullable = false, unique = true)
  private String driverCode;

  /** Display name, e.g. "Marcus Vance" (Phase 2: the API returns it). */
  @Column(name = "full_name")
  private String fullName;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private AppUser user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @Column(name = "license_number")
  private String licenseNumber;

  @Column(name = "license_expires_at")
  private LocalDate licenseExpiresAt;

  /** DQF (Driver Qualification File) id, e.g. DRV-101. */
  @Column(name = "dqf_id")
  private String dqfId;

  @Column(name = "phone")
  private String phone;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Driver() {}

  public Driver(String driverCode, AppUser user, Workspace workspace) {
    this.driverCode = driverCode;
    this.user = user;
    this.workspace = workspace;
  }

  public UUID getId() { return id; }
  public String getDriverCode() { return driverCode; }
  public String getFullName() { return fullName; }
  public void setFullName(String fullName) { this.fullName = fullName; }
  /** Display name: the driver's own name, else the linked login user's name. */
  public String displayName() {
    if (fullName != null && !fullName.isBlank()) {
      return fullName;
    }
    return user != null ? user.getFullName() : driverCode;
  }
  public AppUser getUser() { return user; }
  public void setUser(AppUser user) { this.user = user; }
  public Workspace getWorkspace() { return workspace; }
  public String getLicenseNumber() { return licenseNumber; }
  public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
  public LocalDate getLicenseExpiresAt() { return licenseExpiresAt; }
  public void setLicenseExpiresAt(LocalDate licenseExpiresAt) { this.licenseExpiresAt = licenseExpiresAt; }
  public String getDqfId() { return dqfId; }
  public void setDqfId(String dqfId) { this.dqfId = dqfId; }
  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }
  public Instant getCreatedAt() { return createdAt; }
}
