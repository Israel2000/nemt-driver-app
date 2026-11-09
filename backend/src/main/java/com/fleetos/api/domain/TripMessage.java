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

/** One message in a per-trip driver ↔ dispatch thread. */
@Entity
@Table(name = "trip_messages")
public class TripMessage {

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

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sender_user_id")
  private AppUser senderUser;

  /** 'driver' | 'dispatch' — the side that sent it. */
  @Column(name = "sender_role", nullable = false)
  private String senderRole;

  @Column(name = "sender_name", nullable = false)
  private String senderName;

  @Column(name = "body", nullable = false, columnDefinition = "TEXT")
  private String body;

  @Column(name = "read_flag", nullable = false)
  private boolean readFlag = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected TripMessage() {}

  public TripMessage(Trip trip, Workspace workspace, String senderRole, String senderName, String body) {
    this.trip = trip;
    this.workspace = workspace;
    this.senderRole = senderRole;
    this.senderName = senderName;
    this.body = body;
  }

  public UUID getId() { return id; }
  public Trip getTrip() { return trip; }
  public Workspace getWorkspace() { return workspace; }
  public AppUser getSenderUser() { return senderUser; }
  public void setSenderUser(AppUser senderUser) { this.senderUser = senderUser; }
  public String getSenderRole() { return senderRole; }
  public String getSenderName() { return senderName; }
  public String getBody() { return body; }
  public boolean isReadFlag() { return readFlag; }
  public void setReadFlag(boolean readFlag) { this.readFlag = readFlag; }
  public Instant getCreatedAt() { return createdAt; }
}
