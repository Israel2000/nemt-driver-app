package com.fleetos.api.notify;

import com.fleetos.api.domain.AppNotification;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.notify.NotificationService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** In-app notifications: the stored channel clients poll. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notifications;

  public NotificationController(NotificationService notifications) {
    this.notifications = notifications;
  }

  @GetMapping
  public List<NotificationResponse> list(@AuthenticationPrincipal AppUser user) {
    return notifications.listFor(user).stream()
        .map(NotificationController::toResponse)
        .toList();
  }

  @GetMapping("/unread-count")
  public java.util.Map<String, Long> unreadCount(@AuthenticationPrincipal AppUser user) {
    return java.util.Map.of("unread", notifications.unreadCount(user));
  }

  @PostMapping("/{id}/read")
  public void markRead(@AuthenticationPrincipal AppUser user, @PathVariable UUID id) {
    notifications.markRead(user, id);
  }

  @PostMapping("/read-all")
  public void markAllRead(@AuthenticationPrincipal AppUser user) {
    notifications.markAllRead(user);
  }

  private static NotificationResponse toResponse(AppNotification n) {
    return new NotificationResponse(
        n.getId(), n.getType(), n.getTitle(), n.getBody(),
        n.getTrip() == null ? null : n.getTrip().getCode(),
        n.isReadFlag(), n.getCreatedAt());
  }

  public record NotificationResponse(
      UUID id, String type, String title, String body,
      String tripCode, boolean read, Instant createdAt) {}
}
