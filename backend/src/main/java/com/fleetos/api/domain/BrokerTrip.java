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
 * One broker trip as received through intake — the raw broker payload plus
 * its normalised fields. Deduped by (workspace, broker, broker_trip_id):
 * a re-sent trip is reported DUPLICATE, never imported twice. Importing
 * creates a real Trip (DQF eligibility still enforced by TripService).
 */
@Entity
@Table(name = "broker_trips")
public class BrokerTrip {

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

  /** The broker's own trip reference (their id, not ours). */
  @Column(name = "broker_trip_id", nullable = false)
  private String brokerTripId;

  /** RECEIVED | IMPORTED | REJECTED | DUPLICATE */
  @Column(name = "status", nullable = false)
  private String status = "RECEIVED";

  @Column(name = "raw_payload", columnDefinition = "TEXT")
  private String rawPayload;

  @Column(name = "rider_name")
  private String riderName;

  @Column(name = "pickup_address", columnDefinition = "TEXT")
  private String pickupAddress;

  @Column(name = "dropoff_address", columnDefinition = "TEXT")
  private String dropoffAddress;

  @Column(name = "scheduled_at")
  private Instant scheduledAt;

  @Column(name = "mobility", nullable = false)
  private String mobility = "ambulatory";

  @Column(name = "wheelchair", nullable = false)
  private boolean wheelchair = false;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "imported_trip_id")
  private Trip importedTrip;

  @Column(name = "import_error", columnDefinition = "TEXT")
  private String importError;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected BrokerTrip() {}

  public BrokerTrip(Workspace workspace, String broker, String brokerTripId) {
    this.workspace = workspace;
    this.broker = broker;
    this.brokerTripId = brokerTripId;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public String getBroker() { return broker; }
  public String getBrokerTripId() { return brokerTripId; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getRawPayload() { return rawPayload; }
  public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }
  public String getRiderName() { return riderName; }
  public void setRiderName(String riderName) { this.riderName = riderName; }
  public String getPickupAddress() { return pickupAddress; }
  public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
  public String getDropoffAddress() { return dropoffAddress; }
  public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }
  public Instant getScheduledAt() { return scheduledAt; }
  public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
  public String getMobility() { return mobility; }
  public void setMobility(String mobility) { this.mobility = mobility; }
  public boolean isWheelchair() { return wheelchair; }
  public void setWheelchair(boolean wheelchair) { this.wheelchair = wheelchair; }
  public Trip getImportedTrip() { return importedTrip; }
  public void setImportedTrip(Trip importedTrip) { this.importedTrip = importedTrip; }
  public String getImportError() { return importError; }
  public void setImportError(String importError) { this.importError = importError; }
  public Instant getCreatedAt() { return createdAt; }
}
