package com.fleetos.api.repo;

import com.fleetos.api.domain.ComplianceCheck;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceCheckRepository extends JpaRepository<ComplianceCheck, UUID> {
  List<ComplianceCheck> findByDriverIdOrderByCheckedAtDesc(UUID driverId);
  List<ComplianceCheck> findByWorkspaceIdOrderByCheckedAtDesc(String workspaceId);
}
