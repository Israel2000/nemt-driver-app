package com.fleetos.api.proof;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.ProofFile;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.repo.ProofFileRepository;
import com.fleetos.api.trips.TripService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Binary proof upload: signature images / odometer photos stored on local
 * disk (configured directory, gitignored) with metadata in proof_files.
 *
 * <p>Evidence mapping (what counts toward the billable requirements):
 * <ul>
 *   <li>an ODOMETER file satisfies the odometer requirement</li>
 *   <li>a SIGNATURE_DRIVER file satisfies the driver-signature requirement</li>
 *   <li>a SIGNATURE_PASSENGER file satisfies the passenger-signature
 *       requirement</li>
 * </ul>
 * The existing JSON proof endpoint (data URLs) keeps working as before —
 * binary files are an additional evidence path, not a replacement.
 * Allowed types: images + PDF, max 10 MB per file.
 */
@Service
public class ProofFileService {

  public static final Set<String> ALLOWED_TYPES = Set.of(
      "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf");
  public static final long MAX_BYTES = 10L * 1024 * 1024;

  private final ProofFileRepository proofFiles;
  private final TripService tripService;
  private final Path uploadDir;

  public ProofFileService(ProofFileRepository proofFiles, TripService tripService,
      @Value("${app.uploads.dir:backend/uploads}") String uploadDir) {
    this.proofFiles = proofFiles;
    this.tripService = tripService;
    this.uploadDir = Path.of(uploadDir);
  }

  /** Does the trip already have a binary file of this kind? (billable gate helper) */
  @Transactional(readOnly = true)
  public boolean hasKind(UUID tripId, String kind) {
    return proofFiles.existsByTripIdAndKind(tripId, kind);
  }

  @Transactional
  public ProofFile upload(AppUser user, String tripIdOrCode, String kind, MultipartFile file) {
    Trip trip = tripService.resolveTrip(user, tripIdOrCode);
    tripService.requireTripAccess(user, trip);
    String k = kind == null ? "" : kind.trim().toUpperCase();
    if (!List.of("SIGNATURE_DRIVER", "SIGNATURE_PASSENGER", "ODOMETER").contains(k)) {
      throw ApiException.badRequest("kind must be SIGNATURE_DRIVER, SIGNATURE_PASSENGER or ODOMETER");
    }
    if (file == null || file.isEmpty()) {
      throw ApiException.badRequest("No file uploaded");
    }
    if (file.getSize() > MAX_BYTES) {
      throw ApiException.badRequest("File too large — max 10 MB");
    }
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
      throw ApiException.badRequest(
          "Unsupported file type: " + contentType + " (allowed: images and PDF)");
    }
    String original = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
    String safeName = original.replaceAll("[^A-Za-z0-9._-]", "_");
    String stored = UUID.randomUUID() + "_" + safeName;
    try {
      Files.createDirectories(uploadDir);
      Path target = uploadDir.resolve(stored);
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    } catch (IOException e) {
      throw new IllegalStateException("Could not store uploaded file", e);
    }
    ProofFile proof = new ProofFile(trip.getWorkspace(), trip, k, original, stored,
        contentType, file.getSize(), user);
    proof = proofFiles.save(proof);
    // A binary file is evidence: mirror signature files onto the trip's
    // flags so the COMPLETED gate sees them. Odometer files are NOT given
    // a fake reading — the gate consults proof files directly (see
    // TripService.missingProof), so no invented odometer value is stored.
    if ("SIGNATURE_PASSENGER".equals(k)) {
      trip.setPassengerSignature(true);
    }
    if ("SIGNATURE_DRIVER".equals(k)) {
      trip.setDriverSignature(true);
    }
    if ("SIGNATURE_PASSENGER".equals(k) || "SIGNATURE_DRIVER".equals(k)) {
      tripService.saveTrip(trip);
    }
    return proof;
  }

  @Transactional(readOnly = true)
  public List<ProofFile> listForTrip(AppUser user, String tripIdOrCode) {
    Trip trip = tripService.resolveTrip(user, tripIdOrCode);
    tripService.requireTripAccess(user, trip);
    return proofFiles.findByTripIdOrderByCreatedAtAsc(trip.getId());
  }

  @Transactional(readOnly = true)
  public ProofFile resolveFile(AppUser user, UUID id) {
    ProofFile proof = proofFiles.findById(id)
        .orElseThrow(() -> ApiException.notFound("Proof file"));
    if (!proof.getWorkspace().getId().equals(user.getWorkspace().getId())) {
      throw ApiException.notFound("Proof file");
    }
    return proof;
  }

  @Transactional(readOnly = true)
  public Resource download(AppUser user, UUID id) {
    ProofFile proof = resolveFile(user, id);
    try {
      Path path = uploadDir.resolve(proof.getStoredFilename()).normalize();
      if (!path.startsWith(uploadDir.normalize()) || !Files.exists(path)) {
        throw ApiException.notFound("Proof file");
      }
      return new UrlResource(path.toUri());
    } catch (ApiException ex) {
      throw ex;
    } catch (Exception e) {
      throw new IllegalStateException("Could not read uploaded file", e);
    }
  }

  public ProofFileResponse toResponse(ProofFile proof) {
    return new ProofFileResponse(
        proof.getId(), proof.getTrip().getCode(), proof.getKind(),
        proof.getFilename(), proof.getContentType(), proof.getSizeBytes(),
        proof.getCreatedAt());
  }

  public record ProofFileResponse(
      UUID id, String tripCode, String kind, String filename,
      String contentType, Long sizeBytes, java.time.Instant createdAt) {}
}
