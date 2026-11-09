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

  @Column(name = "patient_phone")
  private String patientPhone;

  /** ambulatory | wheelchair | stretcher (frontend MobilityType). */
  @Column(name = "mobility", nullable = false)
  private String mobility = "ambulatory";

  @Column(name = "pickup_address")
  private String pickupAddress;

  @Column(name = "pickup_lat", precision = 10, scale = 7)
  private BigDecimal pickupLat;

  @Column(name = "pickup_lng", precision = 10, scale = 7)
  private BigDecimal pickupLng;

  @Column(name = "dropoff_address")
  private String dropoffAddress;

  @Column(name = "dropoff_lat", precision = 10, scale = 7)
  private BigDecimal dropoffLat;

  @Column(name = "dropoff_lng", precision = 10, scale = 7)
  private BigDecimal dropoffLng;

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

  /** Signature images (data URLs from the driver canvas capture). */
  @Column(name = "passenger_signature_data", columnDefinition = "TEXT")
  private String passengerSignatureData;

  @Column(name = "driver_signature_data", columnDefinition = "TEXT")
  private String driverSignatureData;

  /** Who signed at drop-off (patient / facility staff). */
  @Column(name = "signee_name")
  private String signeeName;

  @Column(name = "signee_type")
  private String signeeType;

  @Column(name = "completed_at")
  private Instant completedAt;

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
  public String getPatientPhone() { return patientPhone; }
  public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
  public String getMobility() { return mobility; }
  public void setMobility(String mobility) { this.mobility = mobility; }
  public String getPickupAddress() { return pickupAddress; }
  public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
  public BigDecimal getPickupLat() { return pickupLat; }
  public void setPickupLat(BigDecimal pickupLat) { this.pickupLat = pickupLat; }
  public BigDecimal getPickupLng() { return pickupLng; }
  public void setPickupLng(BigDecimal pickupLng) { this.pickupLng = pickupLng; }
  public String getDropoffAddress() { return dropoffAddress; }
  public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }
  public BigDecimal getDropoffLat() { return dropoffLat; }
  public void setDropoffLat(BigDecimal dropoffLat) { this.dropoffLat = dropoffLat; }
  public BigDecimal getDropoffLng() { return dropoffLng; }
  public void setDropoffLng(BigDecimal dropoffLng) { this.dropoffLng = dropoffLng; }
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
  public String getPassengerSignatureData() { return passengerSignatureData; }
  public void setPassengerSignatureData(String passengerSignatureData) { this.passengerSignatureData = passengerSignatureData; }
  public String getDriverSignatureData() { return driverSignatureData; }
  public void setDriverSignatureData(String driverSignatureData) { this.driverSignatureData = driverSignatureData; }
  public String getSigneeName() { return signeeName; }
  public void setSigneeName(String signeeName) { this.signeeName = signeeName; }
  public String getSigneeType() { return signeeType; }
  public void setSigneeType(String signeeType) { this.signeeType = signeeType; }
  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
  public boolean isBillable() { return billable; }
  public void setBillable(boolean billable) { this.billable = billable; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
