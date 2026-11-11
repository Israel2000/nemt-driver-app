package com.fleetos.api.notify;

/**
 * Outbound push channel. Implementations deliver a notification outside the
 * app (WebPush, SMS, …). The only implementation shipped is a stub: no
 * push provider credentials exist, so delivery is a no-op that records the
 * attempt. Wiring a real provider means implementing this interface with
 * VAPID keys + a service worker and registering it as the @Primary bean —
 * NotificationService never changes.
 */
public interface PushChannel {

  /** Attempt delivery. Returns true only if a real provider accepted it. */
  boolean deliver(String recipientId, String title, String body);
}
