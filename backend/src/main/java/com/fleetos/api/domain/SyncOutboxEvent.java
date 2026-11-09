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
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

/**
 * Offline-outbox idempotency record: one row per client-generated event id
 * per workspace. (workspace_id, client_event_id) is unique — a second flush
 * carrying the same id is reported as duplicate-skipped and never re-applied.
 */
@Entity
@Table(name = "sync_outbox_events",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_sync_outbox_workspace_client_event",
        columnNames = {"workspace_id", "client_event_id"}))
public class SyncOutboxEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @Column(name = "client_event_id", nullable = false)
  private String clientEventId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "trip_id")
  private Trip trip;

  /** status | assignment | message | securement | proof | exception | dvir */
  @Column(name = "kind", nullable = false)
  private String kind;

  /** APPLIED | REJECTED | DUPLICATE */
  @Column(name = "result", nullable = false)
  private String result;

  @Column(name = "detail", columnDefinition = "TEXT")
  private String detail;

  @Column(name = "processed_at", nullable = false)
  private Instant processedAt = Instant.now();

  protected SyncOutboxEvent() {}

  public SyncOutboxEvent(Workspace workspace, String clientEventId, String kind, String result) {
    this.workspace = workspace;
    this.clientEventId = clientEventId;
    this.kind = kind;
    this.result = result;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public String getClientEventId() { return clientEventId; }
  public Trip getTrip() { return trip; }
  public void setTrip(Trip trip) { this.trip = trip; }
  public String getKind() { return kind; }
  public String getResult() { return result; }
  public void setResult(String result) { this.result = result; }
  public String getDetail() { return detail; }
  public void setDetail(String detail) { this.detail = detail; }
  public Instant getProcessedAt() { return processedAt; }
}
