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
  public Instant getCreatedAt() { return createdAt; }
}
