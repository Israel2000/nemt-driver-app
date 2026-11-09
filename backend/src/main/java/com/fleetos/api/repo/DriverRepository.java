package com.fleetos.api.repo;

import com.fleetos.api.domain.Driver;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, UUID> {
  Optional<Driver> findByDriverCode(String driverCode);
  List<Driver> findByWorkspaceId(String workspaceId);
}
