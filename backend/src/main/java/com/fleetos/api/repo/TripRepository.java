package com.fleetos.api.repo;

import com.fleetos.api.domain.Trip;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripRepository extends JpaRepository<Trip, UUID> {
  Optional<Trip> findByCode(String code);
  List<Trip> findByWorkspaceId(String workspaceId);
}
