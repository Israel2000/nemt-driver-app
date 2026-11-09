package com.fleetos.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "workspaces")
public class Workspace {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private String id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "provider_id")
  private String providerId;

  @Column(name = "fleet_size")
  private String fleetSize;

  /** starter | growth | enterprise */
  @Column(name = "plan", nullable = false)
  private String plan = "growth";

  @Column(name = "billing_cycle", nullable = false)
  private String billingCycle = "monthly";

  /**
   * DQF hard lockout (Phase 2): when ON, a driver with an expired
   * credential is hard-blocked from dispatch (POST /api/trips → 403).
   * When OFF, expired credentials only warn and dispatch is allowed.
   * Stored here (V3: workspaces.dqf_lockout_enabled, default TRUE) so the
   * toggle in the admin billing page has a server-side home.
   */
  @Column(name = "dqf_lockout_enabled", nullable = false)
  private boolean dqfLockoutEnabled = true;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Workspace() {}

  public Workspace(String id, String name, String providerId, String fleetSize, String plan) {
    this.id = id;
    this.name = name;
    this.providerId = providerId;
    this.fleetSize = fleetSize;
    this.plan = plan;
  }

  public String getId() { return id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getProviderId() { return providerId; }
  public void setProviderId(String providerId) { this.providerId = providerId; }
  public String getFleetSize() { return fleetSize; }
  public void setFleetSize(String fleetSize) { this.fleetSize = fleetSize; }
  public String getPlan() { return plan; }
  public void setPlan(String plan) { this.plan = plan; }
  public String getBillingCycle() { return billingCycle; }
  public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }
  public boolean isDqfLockoutEnabled() { return dqfLockoutEnabled; }
  public void setDqfLockoutEnabled(boolean dqfLockoutEnabled) { this.dqfLockoutEnabled = dqfLockoutEnabled; }
  public Instant getCreatedAt() { return createdAt; }
}
