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
 * A signed, expiring rider-tracking token for one trip. One active token
 * per trip (unique on trip_id). The public tracking endpoint accepts the
 * token only — no login — and returns only the safe public subset.
 * Expires 24h after the trip completes (or 7 days after scheduling if
 * the trip never completes).
 */
@Entity
@Table(name = "tracking_tokens")
public class TrackingToken {

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

  @Column(name = "token", nullable = false, unique = true)
  private String token;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected TrackingToken() {}

  public TrackingToken(Trip trip, Workspace workspace, String token, Instant expiresAt) {
    this.trip = trip;
    this.workspace = workspace;
    this.token = token;
    this.expiresAt = expiresAt;
  }

  public UUID getId() { return id; }
  public Trip getTrip() { return trip; }
  public Workspace getWorkspace() { return workspace; }
  public String getToken() { return token; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getCreatedAt() { return createdAt; }
}
