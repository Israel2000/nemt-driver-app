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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * GPS-stamped audit log entry: who did what, when, and where.
 * Phase 2 writes one per trip-status transition, dispatch action, and login.
 */
@Entity
@Table(name = "audit_events")
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private AppUser user;

  @Column(name = "actor", nullable = false)
  private String actor;

  @Column(name = "action", nullable = false)
  private String action;

  @Column(name = "entity_type")
  private String entityType;

  @Column(name = "entity_id")
  private String entityId;

  @Column(name = "gps_lat", precision = 10, scale = 7)
  private BigDecimal gpsLat;

  @Column(name = "gps_lng", precision = 10, scale = 7)
  private BigDecimal gpsLng;

  @Column(name = "details", columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected AuditEvent() {}

  public AuditEvent(Workspace workspace, String actor, String action) {
    this.workspace = workspace;
    this.actor = actor;
    this.action = action;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public AppUser getUser() { return user; }
  public void setUser(AppUser user) { this.user = user; }
  public String getActor() { return actor; }
  public String getAction() { return action; }
  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public BigDecimal getGpsLat() { return gpsLat; }
  public void setGpsLat(BigDecimal gpsLat) { this.gpsLat = gpsLat; }
  public BigDecimal getGpsLng() { return gpsLng; }
  public void setGpsLng(BigDecimal gpsLng) { this.gpsLng = gpsLng; }
  public String getDetails() { return details; }
  public void setDetails(String details) { this.details = details; }
  public Instant getCreatedAt() { return createdAt; }
}
