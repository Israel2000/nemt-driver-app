package com.fleetos.api.proof;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.proof.ProofFileService.ProofFileResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Binary proof upload: signature images / odometer photos. Files are
 * stored on local disk (configured uploads directory) with metadata in
 * proof_files. An ODOMETER file satisfies the odometer requirement and
 * SIGNATURE_* files satisfy the signature requirements — the existing
 * JSON proof endpoint keeps working as before.
 */
@RestController
public class ProofFileController {

  private final ProofFileService proofFiles;

  public ProofFileController(ProofFileService proofFiles) {
    this.proofFiles = proofFiles;
  }

  @PostMapping("/api/trips/{id}/proof/upload")
  public ResponseEntity<ProofFileResponse> upload(
      @AuthenticationPrincipal AppUser user, @PathVariable String id,
      @RequestParam("file") MultipartFile file,
      @RequestParam("kind") String kind) {
    return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
        .body(proofFiles.toResponse(proofFiles.upload(user, id, kind, file)));
  }

  @GetMapping("/api/trips/{id}/proof/files")
  public List<ProofFileResponse> list(
      @AuthenticationPrincipal AppUser user, @PathVariable String id) {
    return proofFiles.listForTrip(user, id).stream()
        .map(proofFiles::toResponse)
        .toList();
  }

  @GetMapping("/api/proof-files/{id}")
  public ResponseEntity<Resource> download(
      @AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    com.fleetos.api.domain.ProofFile proof = proofFiles.resolveFile(user, id);
    Resource resource = proofFiles.download(user, id);
    String contentType = proof.getContentType() == null
        ? MediaType.APPLICATION_OCTET_STREAM_VALUE : proof.getContentType();
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(contentType))
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + proof.getFilename().replace("\"", "") + "\"")
        .body(resource);
  }
}
