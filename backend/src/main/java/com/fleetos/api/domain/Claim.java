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
 * A Medicaid claim built from a completed + billable trip.
 * Status: DRAFT → SUBMITTED → PAID, or DENIED (with a reason).
 * The amount is a documented placeholder rate (see BillingService) until
 * real broker rate tables exist. cms1500Json is the structured CMS-1500
 * form data for the claim — data only, not a filed claim.
 */
@Entity
@Table(name = "claims")
public class Claim {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "claim_number", nullable = false, unique = true)
  private String claimNumber;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "trip_id", nullable = false)
  private Trip trip;

  @Column(name = "broker")
  private String broker;

  @Column(name = "payer")
  private String payer;

  @Column(name = "status", nullable = false)
  private String status = "DRAFT";

  @Column(name = "amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal amount;

  @Column(name = "currency", nullable = false)
  private String currency = "USD";

  @Column(name = "cms1500_json", columnDefinition = "TEXT")
  private String cms1500Json;

  @Column(name = "denial_reason", columnDefinition = "TEXT")
  private String denialReason;

  @Column(name = "submitted_at")
  private Instant submittedAt;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected Claim() {}

  public Claim(String claimNumber, Workspace workspace, Trip trip, BigDecimal amount) {
    this.claimNumber = claimNumber;
    this.workspace = workspace;
    this.trip = trip;
    this.amount = amount;
  }

  public UUID getId() { return id; }
  public String getClaimNumber() { return claimNumber; }
  public Workspace getWorkspace() { return workspace; }
  public Trip getTrip() { return trip; }
  public String getBroker() { return broker; }
  public void setBroker(String broker) { this.broker = broker; }
  public String getPayer() { return payer; }
  public void setPayer(String payer) { this.payer = payer; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public BigDecimal getAmount() { return amount; }
  public String getCurrency() { return currency; }
  public String getCms1500Json() { return cms1500Json; }
  public void setCms1500Json(String cms1500Json) { this.cms1500Json = cms1500Json; }
  public String getDenialReason() { return denialReason; }
  public void setDenialReason(String denialReason) { this.denialReason = denialReason; }
  public Instant getSubmittedAt() { return submittedAt; }
  public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
  public Instant getPaidAt() { return paidAt; }
  public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
