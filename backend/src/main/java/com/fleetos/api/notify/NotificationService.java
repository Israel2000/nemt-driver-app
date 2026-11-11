package com.fleetos.api.notify;

import com.fleetos.api.domain.AppNotification;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Driver;
import com.fleetos.api.domain.Role;
import com.fleetos.api.domain.Trip;
import com.fleetos.api.domain.Workspace;
import com.fleetos.api.repo.AppNotificationRepository;
import com.fleetos.api.repo.AppUserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notifications. The real channel is in-app + stored: every event writes
 * a row the recipient's client polls (GET /api/notifications). The push
 * channel is a stub (NoOpPushChannel) — an attempt is offered to it and
 * logged, never faked as delivered.
 *
 * Recipients:
 * <ul>
 *   <li>TRIP_ASSIGNED → the assigned driver (their login user)</li>
 *   <li>TRIP_EN_ROUTE / TRIP_ARRIVED / TRIP_COMPLETED / CLAIM_DENIED →
 *       every ADMIN + DISPATCHER in the workspace</li>
 *   <li>MESSAGE → the other side of the thread (driver message → dispatch;
 *       dispatch message → the trip's driver)</li>
 * </ul>
 */
@Service
public class NotificationService {

  private final AppNotificationRepository notifications;
  private final AppUserRepository users;
  private final PushChannel pushChannel;

  public NotificationService(AppNotificationRepository notifications,
      AppUserRepository users, PushChannel pushChannel) {
    this.notifications = notifications;
    this.users = users;
    this.pushChannel = pushChannel;
  }

  @Transactional
  public AppNotification notify(AppUser recipient, String type, String title, String body, Trip trip) {
    AppNotification n = new AppNotification(
        recipient.getWorkspace(), recipient, type, title, body, trip);
    n = notifications.save(n);
    pushChannel.deliver(recipient.getId().toString(), title, body);
    return n;
  }

  /** Every ADMIN + DISPATCHER in the workspace gets the notification. */
  @Transactional
  public void notifyDispatchers(Workspace workspace, String type, String title, String body, Trip trip) {
    for (AppUser user : users.findByWorkspaceId(workspace.getId())) {
      if (user.getRole() == Role.ADMIN || user.getRole() == Role.DISPATCHER) {
        notify(user, type, title, body, trip);
      }
    }
  }

  /** The assigned driver's login user, if the driver has one. */
  @Transactional
  public void notifyDriver(Trip trip, String type, String title, String body) {
    Driver driver = trip.getDriver();
    if (driver != null && driver.getUser() != null) {
      notify(driver.getUser(), type, title, body, trip);
    }
  }

  /** Trip lifecycle events → dispatchers, except assignment → the driver. */
  @Transactional
  public void onTripStatus(Trip trip, String frontendStatus) {
    String rider = trip.getRiderName() == null ? trip.getCode() : trip.getRiderName();
    switch (frontendStatus) {
      case "scheduled" -> notifyDriver(trip, "TRIP_ASSIGNED",
          "Trip assigned: " + trip.getCode(),
          "You have a new trip — " + rider + ", pickup " + trip.getPickupAddress());
      case "en_route_pickup" -> notifyDispatchers(trip.getWorkspace(), "TRIP_EN_ROUTE",
          "Driver en route — " + trip.getCode(),
          (trip.getDriver() == null ? "Driver" : trip.getDriver().displayName())
              + " is en route to pick up " + rider + ".", trip);
      case "arrived_pickup" -> notifyDispatchers(trip.getWorkspace(), "TRIP_ARRIVED",
          "Driver arrived — " + trip.getCode(),
          (trip.getDriver() == null ? "Driver" : trip.getDriver().displayName())
              + " arrived at the pickup for " + rider + ".", trip);
      case "completed" -> notifyDispatchers(trip.getWorkspace(), "TRIP_COMPLETED",
          "Trip completed — " + trip.getCode(),
          rider + " was dropped off. Trip is " + (trip.isBillable() ? "billable." : "awaiting proof."), trip);
      default -> { /* no notification for other statuses */ }
    }
  }

  /** A message on a trip notifies the other side of the thread. */
  @Transactional
  public void onMessage(Trip trip, String senderRole, String senderName, String body) {
    if ("driver".equals(senderRole)) {
      notifyDispatchers(trip.getWorkspace(), "MESSAGE",
          "Message from " + senderName + " — " + trip.getCode(), body, trip);
    } else {
      notifyDriver(trip, "MESSAGE",
          "Message from dispatch — " + trip.getCode(), body);
    }
  }

  @Transactional
  public void onClaimDenied(Workspace workspace, String claimNumber, String reason) {
    notifyDispatchers(workspace, "CLAIM_DENIED",
        "Claim denied — " + claimNumber,
        "Claim " + claimNumber + " was denied" + (reason == null ? "." : ": " + reason),
        null);
  }

  // ------------------------------------------------------------------- reads

  @Transactional(readOnly = true)
  public List<AppNotification> listFor(AppUser user) {
    return notifications.findByRecipientIdOrderByCreatedAtDesc(user.getId());
  }

  @Transactional(readOnly = true)
  public long unreadCount(AppUser user) {
    return notifications.countByRecipientIdAndReadFlagFalse(user.getId());
  }

  @Transactional
  public void markRead(AppUser user, java.util.UUID id) {
    notifications.findById(id).ifPresent(n -> {
      if (n.getRecipient().getId().equals(user.getId())) {
        n.setReadFlag(true);
        notifications.save(n);
      }
    });
  }

  @Transactional
  public void markAllRead(AppUser user) {
    List<AppNotification> unread = notifications.findByRecipientIdOrderByCreatedAtDesc(user.getId())
        .stream().filter(n -> !n.isReadFlag()).toList();
    for (AppNotification n : unread) {
      n.setReadFlag(true);
    }
    notifications.saveAll(unread);
  }
}
