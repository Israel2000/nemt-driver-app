package com.fleetos.api.brokers;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

/**
 * One broker's intake adapter: maps that broker's payload shape onto the
 * app's normalised trip fields. Adapters never call a network — they only
 * translate the payload a broker (or an operator pasting one in) supplies.
 * A live broker feed means implementing a fetcher that calls the broker's
 * API with real credentials and hands each payload to the adapter here.
 */
public interface BrokerAdapter {

  /** Broker key, e.g. MODIVCARE. */
  String broker();

  /**
   * Normalised view of one broker trip payload. Returns null when the
   * payload is missing the fields a trip needs (caller rejects it).
   */
  NormalizedBrokerTrip normalize(JsonNode payload);

  record NormalizedBrokerTrip(
      String brokerTripId,
      String riderName,
      String pickupAddress,
      String dropoffAddress,
      Instant scheduledAt,
      String mobility,
      boolean wheelchair) {}
}
