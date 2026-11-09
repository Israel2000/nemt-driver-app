package com.fleetos.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * One GPS- + timestamp-stamped status transition for a trip — the queryable
 * per-trip history behind GET /api/trips/{id}/events. Every transition also
 * writes a mirrored row to audit_events (the workspace audit trail).
 */
@Entity
@Table(name = "trip_status_events")
public class TripStatusEvent {

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

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private TripStatus status;

  @Column(name = "gps_lat", precision = 10, scale = 7)
  private BigDecimal gpsLat;

  @Column(name = "gps_lng", precision = 10, scale = 7)
  private BigDecimal gpsLng;

  /** 'device' = live fix, 'estimated' = stop/last-known coords, 'unavailable'. */
  @Column(name = "gps_source", nullable = false)
  private String gpsSource = "estimated";

  @Column(name = "by_role")
  private String byRole;

  @Column(name = "by_name")
  private String byName;

  @Column(name = "reason_code")
  private String reasonCode;

  @Column(name = "reason_note", columnDefinition = "TEXT")
  private String reasonNote;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected TripStatusEvent() {}

  public TripStatusEvent(Trip trip, Workspace workspace, TripStatus status) {
    this.trip = trip;
    this.workspace = workspace;
    this.status = status;
  }

  public UUID getId() { return id; }
  public Trip getTrip() { return trip; }
  public Workspace getWorkspace() { return workspace; }
  public TripStatus getStatus() { return status; }
  public BigDecimal getGpsLat() { return gpsLat; }
  public void setGpsLat(BigDecimal gpsLat) { this.gpsLat = gpsLat; }
  public BigDecimal getGpsLng() { return gpsLng; }
  public void setGpsLng(BigDecimal gpsLng) { this.gpsLng = gpsLng; }
  public String getGpsSource() { return gpsSource; }
  public void setGpsSource(String gpsSource) { this.gpsSource = gpsSource; }
  public String getByRole() { return byRole; }
  public void setByRole(String byRole) { this.byRole = byRole; }
  public String getByName() { return byName; }
  public void setByName(String byName) { this.byName = byName; }
  public String getReasonCode() { return reasonCode; }
  public void setReasonCode(String reasonCode) { this.reasonCode = reasonCode; }
  public String getReasonNote() { return reasonNote; }
  public void setReasonNote(String reasonNote) { this.reasonNote = reasonNote; }
  public Instant getCreatedAt() { return createdAt; }
}
