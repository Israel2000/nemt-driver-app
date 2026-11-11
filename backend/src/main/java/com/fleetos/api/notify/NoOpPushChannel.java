package com.fleetos.api.notify;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Stub push channel: there is no push provider configured (no VAPID keys,
 * no service worker, no provider account), so nothing is delivered. Every
 * attempt is logged honestly instead of faking a delivery — the in-app
 * notification (stored in the DB) is the real channel until a provider
 * is wired in.
 */
@Component
public class NoOpPushChannel implements PushChannel {

  private static final Logger log = LoggerFactory.getLogger(NoOpPushChannel.class);

  @Override
  public boolean deliver(String recipientId, String title, String body) {
    log.info("[push-stub] NOT delivered (no push provider configured) — recipient={} title={}",
        recipientId, title);
    return false;
  }
}
