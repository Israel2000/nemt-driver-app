package com.fleetos.api.repo;

import com.fleetos.api.domain.Vehicle;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
  List<Vehicle> findByWorkspaceId(String workspaceId);
}
