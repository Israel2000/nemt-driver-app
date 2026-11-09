package com.fleetos.api.repo;

import com.fleetos.api.domain.TripStatusEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripStatusEventRepository extends JpaRepository<TripStatusEvent, UUID> {
  List<TripStatusEvent> findByTripIdOrderByCreatedAtAsc(UUID tripId);
}
