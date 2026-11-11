package com.fleetos.api.repo;

import com.fleetos.api.domain.Claim;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {
  List<Claim> findByWorkspaceIdOrderByCreatedAtDesc(String workspaceId);
  List<Claim> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(String workspaceId, String status);
  Optional<Claim> findByClaimNumber(String claimNumber);
  Optional<Claim> findByTripId(UUID tripId);
  boolean existsByTripId(UUID tripId);
}
