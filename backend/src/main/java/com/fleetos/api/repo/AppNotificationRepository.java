package com.fleetos.api.repo;

import com.fleetos.api.domain.AppNotification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppNotificationRepository extends JpaRepository<AppNotification, UUID> {
  List<AppNotification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
  long countByRecipientIdAndReadFlagFalse(UUID recipientId);
}
