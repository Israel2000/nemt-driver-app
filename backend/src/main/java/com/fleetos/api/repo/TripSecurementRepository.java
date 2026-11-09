package com.fleetos.api.repo;

import com.fleetos.api.domain.TripSecurement;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripSecurementRepository extends JpaRepository<TripSecurement, UUID> {
  Optional<TripSecurement> findByTripId(UUID tripId);
}
