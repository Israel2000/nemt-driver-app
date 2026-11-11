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
 * Metadata for one binary proof file (signature image / odometer photo)
 * stored on local disk under the configured uploads directory. The file
 * itself lives on disk; this row is the evidence link that counts toward
 * the trip's billable proof requirements (see ProofFileService).
 * Kinds: SIGNATURE_DRIVER | SIGNATURE_PASSENGER | ODOMETER.
 */
@Entity
@Table(name = "proof_files")
public class ProofFile {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "trip_id", nullable = false)
  private Trip trip;

  @Column(name = "kind", nullable = false)
  private String kind;

  @Column(name = "filename", nullable = false)
  private String filename;

  @Column(name = "stored_filename", nullable = false)
  private String storedFilename;

  @Column(name = "content_type")
  private String contentType;

  @Column(name = "size_bytes")
  private Long sizeBytes;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "uploaded_by_user_id")
  private AppUser uploadedBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  protected ProofFile() {}

  public ProofFile(Workspace workspace, Trip trip, String kind, String filename,
      String storedFilename, String contentType, Long sizeBytes, AppUser uploadedBy) {
    this.workspace = workspace;
    this.trip = trip;
    this.kind = kind;
    this.filename = filename;
    this.storedFilename = storedFilename;
    this.contentType = contentType;
    this.sizeBytes = sizeBytes;
    this.uploadedBy = uploadedBy;
  }

  public UUID getId() { return id; }
  public Workspace getWorkspace() { return workspace; }
  public Trip getTrip() { return trip; }
  public String getKind() { return kind; }
  public String getFilename() { return filename; }
  public String getStoredFilename() { return storedFilename; }
  public String getContentType() { return contentType; }
  public Long getSizeBytes() { return sizeBytes; }
  public AppUser getUploadedBy() { return uploadedBy; }
  public Instant getCreatedAt() { return createdAt; }
}
