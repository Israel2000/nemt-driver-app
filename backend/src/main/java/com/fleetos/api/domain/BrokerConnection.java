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

/** One broker's connection state for a workspace. All brokers start
 * NOT_CONNECTED — a real connection needs broker-issued API credentials,
 * which do not exist here. The row exists so the UI shows the truth
 * instead of pretending to be connected. */
@Entity
@Table(name = "broker_connections")
public class BrokerConnection {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  /** MODIVCARE | MTM | VERIDA */
  @Column(name = "broker", nullable = false)
  private String broker;

  /** NOT_CONNECTED | CONNECTED */
  @Column(name = "status", nullable = false)
  private String status = "NOT_CONNECTED";

  @Column(name = "credentials_configured", nullable = false)
  private boolean credentialsConfigured = false;

  @Column(name = "note", columnDefinition = "TEXT")
  private String note;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected BrokerConnection() {}

  public BrokerConnection(Workspace workspace, String broker, String note) {
    this.workspace = workspace;
    this.broker = broker;
    this.note = note;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public String getBroker() { return broker; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public boolean isCredentialsConfigured() { return credentialsConfigured; }
  public void setCredentialsConfigured(boolean credentialsConfigured) { this.credentialsConfigured = credentialsConfigured; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
