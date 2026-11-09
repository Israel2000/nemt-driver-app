package com.fleetos.api.repo;

import com.fleetos.api.domain.TripMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripMessageRepository extends JpaRepository<TripMessage, UUID> {
  List<TripMessage> findByTripIdOrderByCreatedAtAsc(UUID tripId);
}
