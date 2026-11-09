package com.fleetos.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

@Entity
@Table(name = "trips")
public class Trip {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  /** Human code used by the frontend, e.g. TRP-101. */
  @Column(name = "code", nullable = false, unique = true)
  private String code;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "driver_id")
  private Driver driver;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "vehicle_id")
  private Vehicle vehicle;

  @Column(name = "rider_name")
  private String riderName;

  @Column(name = "pickup_address")
  private String pickupAddress;

  @Column(name = "dropoff_address")
  private String dropoffAddress;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private TripStatus status = TripStatus.ASSIGNED;

  @Column(name = "wheelchair", nullable = false)
  private boolean wheelchair = false;

  @Column(name = "scheduled_at")
  private Instant scheduledAt;

  @Column(name = "gps_lat", precision = 10, scale = 7)
  private BigDecimal gpsLat;

  @Column(name = "gps_lng", precision = 10, scale = 7)
  private BigDecimal gpsLng;

  @Column(name = "arrived_lat", precision = 10, scale = 7)
  private BigDecimal arrivedLat;

  @Column(name = "arrived_lng", precision = 10, scale = 7)
  private BigDecimal arrivedLng;

  @Column(name = "odometer_start")
  private Integer odometerStart;

  @Column(name = "odometer_end")
  private Integer odometerEnd;

  /** Proof-of-delivery evidence flags (Phase 2 enforces them for billable trips). */
  @Column(name = "passenger_signature", nullable = false)
  private boolean passengerSignature = false;

  @Column(name = "driver_signature", nullable = false)
  private boolean driverSignature = false;

  @Column(name = "billable", nullable = false)
  private boolean billable = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  protected Trip() {}

  public Trip(String code, Workspace workspace) {
    this.code = code;
    this.workspace = workspace;
  }

  public UUID getId() { return id; }
  public String getCode() { return code; }
  public Workspace getWorkspace() { return workspace; }
  public Driver getDriver() { return driver; }
  public void setDriver(Driver driver) { this.driver = driver; }
  public Vehicle getVehicle() { return vehicle; }
  public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
  public String getRiderName() { return riderName; }
  public void setRiderName(String riderName) { this.riderName = riderName; }
  public String getPickupAddress() { return pickupAddress; }
  public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
  public String getDropoffAddress() { return dropoffAddress; }
  public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }
  public TripStatus getStatus() { return status; }
  public void setStatus(TripStatus status) { this.status = status; }
  public boolean isWheelchair() { return wheelchair; }
  public void setWheelchair(boolean wheelchair) { this.wheelchair = wheelchair; }
  public Instant getScheduledAt() { return scheduledAt; }
  public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
  public BigDecimal getGpsLat() { return gpsLat; }
  public void setGpsLat(BigDecimal gpsLat) { this.gpsLat = gpsLat; }
  public BigDecimal getGpsLng() { return gpsLng; }
  public void setGpsLng(BigDecimal gpsLng) { this.gpsLng = gpsLng; }
  public BigDecimal getArrivedLat() { return arrivedLat; }
  public void setArrivedLat(BigDecimal arrivedLat) { this.arrivedLat = arrivedLat; }
  public BigDecimal getArrivedLng() { return arrivedLng; }
  public void setArrivedLng(BigDecimal arrivedLng) { this.arrivedLng = arrivedLng; }
  public Integer getOdometerStart() { return odometerStart; }
  public void setOdometerStart(Integer odometerStart) { this.odometerStart = odometerStart; }
  public Integer getOdometerEnd() { return odometerEnd; }
  public void setOdometerEnd(Integer odometerEnd) { this.odometerEnd = odometerEnd; }
  public boolean isPassengerSignature() { return passengerSignature; }
  public void setPassengerSignature(boolean passengerSignature) { this.passengerSignature = passengerSignature; }
  public boolean isDriverSignature() { return driverSignature; }
  public void setDriverSignature(boolean driverSignature) { this.driverSignature = driverSignature; }
  public boolean isBillable() { return billable; }
  public void setBillable(boolean billable) { this.billable = billable; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
