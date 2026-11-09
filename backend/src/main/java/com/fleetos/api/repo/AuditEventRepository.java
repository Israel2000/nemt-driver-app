package com.fleetos.api.repo;

import com.fleetos.api.domain.AuditEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
  List<AuditEvent> findByWorkspaceIdOrderByCreatedAtDesc(String workspaceId);
}
