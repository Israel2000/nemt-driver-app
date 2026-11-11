package com.fleetos.api.repo;

import com.fleetos.api.domain.ProofFile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProofFileRepository extends JpaRepository<ProofFile, UUID> {
  List<ProofFile> findByTripIdOrderByCreatedAtAsc(UUID tripId);
  boolean existsByTripIdAndKind(UUID tripId, String kind);
  long countByTripIdAndKind(UUID tripId, String kind);
}
