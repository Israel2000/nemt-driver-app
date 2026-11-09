package com.fleetos.api.repo;

import com.fleetos.api.domain.SyncOutboxEvent;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncOutboxEventRepository extends JpaRepository<SyncOutboxEvent, UUID> {
  Optional<SyncOutboxEvent> findByWorkspaceIdAndClientEventId(String workspaceId, String clientEventId);
}
