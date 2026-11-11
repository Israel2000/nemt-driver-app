package com.fleetos.api.repo;

import com.fleetos.api.domain.BrokerConnection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrokerConnectionRepository extends JpaRepository<BrokerConnection, UUID> {
  Optional<BrokerConnection> findByWorkspaceIdAndBroker(String workspaceId, String broker);
  List<BrokerConnection> findByWorkspaceIdOrderByBrokerAsc(String workspaceId);
}
