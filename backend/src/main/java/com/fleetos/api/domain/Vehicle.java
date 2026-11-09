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

@Entity
@Table(name = "vehicles")
public class Vehicle {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  /** e.g. "Van #1" */
  @Column(name = "label", nullable = false)
  private String label;

  @Column(name = "plate")
  private String plate;

  @Column(name = "capacity")
  private Integer capacity;

  @Column(name = "wheelchair_accessible", nullable = false)
  private boolean wheelchairAccessible = false;

  /** ACTIVE | MAINTENANCE | RETIRED */
  @Column(name = "status", nullable = false)
  private String status = "ACTIVE";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Vehicle() {}

  public Vehicle(Workspace workspace, String label) {
    this.workspace = workspace;
    this.label = label;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
  public String getPlate() { return plate; }
  public void setPlate(String plate) { this.plate = plate; }
  public Integer getCapacity() { return capacity; }
  public void setCapacity(Integer capacity) { this.capacity = capacity; }
  public boolean isWheelchairAccessible() { return wheelchairAccessible; }
  public void setWheelchairAccessible(boolean wheelchairAccessible) { this.wheelchairAccessible = wheelchairAccessible; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
}
