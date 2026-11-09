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
 * Wheelchair securement checklist (8 items, all required before a wheelchair
 * trip can board). One row per trip, upserted by POST /api/trips/{id}/securement.
 */
@Entity
@Table(name = "trip_securements")
public class TripSecurement {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "trip_id", nullable = false)
  private Trip trip;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @Column(name = "positioned", nullable = false)
  private boolean positioned;

  @Column(name = "tie_down_front_left", nullable = false)
  private boolean tieDownFrontLeft;

  @Column(name = "tie_down_front_right", nullable = false)
  private boolean tieDownFrontRight;

  @Column(name = "tie_down_rear_left", nullable = false)
  private boolean tieDownRearLeft;

  @Column(name = "tie_down_rear_right", nullable = false)
  private boolean tieDownRearRight;

  @Column(name = "brakes_set", nullable = false)
  private boolean brakesSet;

  @Column(name = "lap_belt", nullable = false)
  private boolean lapBelt;

  @Column(name = "shoulder_belt", nullable = false)
  private boolean shoulderBelt;

  @Column(name = "completed_by")
  private String completedBy;

  @Column(name = "completed_at", nullable = false)
  private Instant completedAt = Instant.now();

  protected TripSecurement() {}

  public TripSecurement(Trip trip, Workspace workspace) {
    this.trip = trip;
    this.workspace = workspace;
  }

  /** All eight items checked — the only state that unlocks boarding. */
  public boolean isComplete() {
    return positioned && tieDownFrontLeft && tieDownFrontRight
        && tieDownRearLeft && tieDownRearRight
        && brakesSet && lapBelt && shoulderBelt;
  }

  public UUID getId() { return id; }
  public Trip getTrip() { return trip; }
  public Workspace getWorkspace() { return workspace; }
  public boolean isPositioned() { return positioned; }
  public void setPositioned(boolean positioned) { this.positioned = positioned; }
  public boolean isTieDownFrontLeft() { return tieDownFrontLeft; }
  public void setTieDownFrontLeft(boolean v) { this.tieDownFrontLeft = v; }
  public boolean isTieDownFrontRight() { return tieDownFrontRight; }
  public void setTieDownFrontRight(boolean v) { this.tieDownFrontRight = v; }
  public boolean isTieDownRearLeft() { return tieDownRearLeft; }
  public void setTieDownRearLeft(boolean v) { this.tieDownRearLeft = v; }
  public boolean isTieDownRearRight() { return tieDownRearRight; }
  public void setTieDownRearRight(boolean v) { this.tieDownRearRight = v; }
  public boolean isBrakesSet() { return brakesSet; }
  public void setBrakesSet(boolean brakesSet) { this.brakesSet = brakesSet; }
  public boolean isLapBelt() { return lapBelt; }
  public void setLapBelt(boolean lapBelt) { this.lapBelt = lapBelt; }
  public boolean isShoulderBelt() { return shoulderBelt; }
  public void setShoulderBelt(boolean shoulderBelt) { this.shoulderBelt = shoulderBelt; }
  public String getCompletedBy() { return completedBy; }
  public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }
  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
