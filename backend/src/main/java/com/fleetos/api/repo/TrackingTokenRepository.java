package com.fleetos.api.repo;

import com.fleetos.api.domain.TrackingToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackingTokenRepository extends JpaRepository<TrackingToken, UUID> {
  Optional<TrackingToken> findByToken(String token);
  Optional<TrackingToken> findByTripId(UUID tripId);
}
