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
import java.time.LocalDate;
import java.util.UUID;

/**
 * A DQF (Driver Qualification File) credential: licence, CPR, DOT medical, etc.
 * Phase 2 enforces expiry server-side before dispatch; Phase 1 stores the rows.
 */
@Entity
@Table(name = "credentials")
public class Credential {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "driver_id", nullable = false)
  private Driver driver;

  /** e.g. LICENSE, CPR, DOT_MEDICAL, DEFENSIVE_DRIVING */
  @Column(name = "type", nullable = false)
  private String type;

  @Column(name = "expires_at")
  private LocalDate expiresAt;

  /** VALID | WARNING | EXPIRED — denormalised for quick dispatch checks. */
  @Column(name = "status", nullable = false)
  private String status = "VALID";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Credential() {}

  public Credential(Driver driver, String type, LocalDate expiresAt, String status) {
    this.driver = driver;
    this.type = type;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  public UUID getId() { return id; }
  public Driver getDriver() { return driver; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public LocalDate getExpiresAt() { return expiresAt; }
  public void setExpiresAt(LocalDate expiresAt) { this.expiresAt = expiresAt; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
}
