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

/** An invoice mirroring a claim amount. Created when a claim is submitted;
 * status: DRAFT → SENT → PAID (or VOID). */
@Entity
@Table(name = "invoices")
public class Invoice {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "invoice_number", nullable = false, unique = true)
  private String invoiceNumber;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "claim_id")
  private Claim claim;

  @Column(name = "amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal amount;

  @Column(name = "status", nullable = false)
  private String status = "DRAFT";

  @Column(name = "due_at")
  private Instant dueAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected Invoice() {}

  public Invoice(String invoiceNumber, Workspace workspace, Claim claim, BigDecimal amount) {
    this.invoiceNumber = invoiceNumber;
    this.workspace = workspace;
    this.claim = claim;
    this.amount = amount;
  }

  public UUID getId() { return id; }
  public String getInvoiceNumber() { return invoiceNumber; }
  public Workspace getWorkspace() { return workspace; }
  public Claim getClaim() { return claim; }
  public BigDecimal getAmount() { return amount; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getDueAt() { return dueAt; }
  public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
  public Instant getCreatedAt() { return createdAt; }
}
