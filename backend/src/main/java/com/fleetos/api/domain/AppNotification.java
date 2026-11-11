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
 * One in-app notification for one user. This is the real, stored channel:
 * the driver/admin clients poll GET /api/notifications. Types:
 * TRIP_ASSIGNED, TRIP_EN_ROUTE, TRIP_ARRIVED, TRIP_COMPLETED,
 * CLAIM_DENIED, MESSAGE. WebPush delivery is a separate, stubbed channel
 * (PushChannel) until VAPID keys + a service worker exist.
 */
@Entity
@Table(name = "notifications")
public class AppNotification {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "recipient_user_id", nullable = false)
  private AppUser recipient;

  @Column(name = "type", nullable = false)
  private String type;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "body", columnDefinition = "TEXT")
  private String body;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "trip_id")
  private Trip trip;

  @Column(name = "read_flag", nullable = false)
  private boolean readFlag = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected AppNotification() {}

  public AppNotification(Workspace workspace, AppUser recipient, String type, String title, String body, Trip trip) {
    this.workspace = workspace;
    this.recipient = recipient;
    this.type = type;
    this.title = title;
    this.body = body;
    this.trip = trip;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public AppUser getRecipient() { return recipient; }
  public String getType() { return type; }
  public String getTitle() { return title; }
  public String getBody() { return body; }
  public Trip getTrip() { return trip; }
  public boolean isReadFlag() { return readFlag; }
  public void setReadFlag(boolean readFlag) { this.readFlag = readFlag; }
  public Instant getCreatedAt() { return createdAt; }
}
