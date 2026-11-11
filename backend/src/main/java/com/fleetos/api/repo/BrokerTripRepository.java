package com.fleetos.api.repo;

import com.fleetos.api.domain.BrokerTrip;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrokerTripRepository extends JpaRepository<BrokerTrip, UUID> {
  Optional<BrokerTrip> findByWorkspaceIdAndBrokerAndBrokerTripId(String workspaceId, String broker, String brokerTripId);
  List<BrokerTrip> findByWorkspaceIdAndBrokerOrderByCreatedAtDesc(String workspaceId, String broker);
  List<BrokerTrip> findByWorkspaceIdOrderByCreatedAtDesc(String workspaceId);
}
