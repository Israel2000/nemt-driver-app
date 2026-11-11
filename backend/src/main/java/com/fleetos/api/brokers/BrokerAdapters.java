package com.fleetos.api.brokers;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import org.springframework.stereotype.Component;

/**
 * Field-name helpers shared by the broker adapters: each broker names the
 * same trip fields differently, so adapters try their known aliases in
 * order and take the first present one.
 */
abstract class BrokerAdapters {

  static String text(JsonNode p, String... fields) {
    for (String f : fields) {
      JsonNode n = p.get(f);
      if (n != null && !n.isNull() && !n.asText().isBlank()) {
        return n.asText().trim();
      }
    }
    return null;
  }

  static boolean bool(JsonNode p, String... fields) {
    for (String f : fields) {
      JsonNode n = p.get(f);
      if (n != null && n.isBoolean()) {
        return n.asBoolean();
      }
      if (n != null && n.isTextual()) {
        String v = n.asText().trim().toLowerCase();
        if ("true".equals(v) || "yes".equals(v) || "wheelchair".equals(v)) {
          return true;
        }
      }
    }
    return false;
  }

  static Instant instant(JsonNode p, String... fields) {
    for (String f : fields) {
      JsonNode n = p.get(f);
      if (n != null && !n.isNull()) {
        try {
          return Instant.parse(n.asText());
        } catch (RuntimeException ignored) {
          // Try epoch millis next.
          try {
            return Instant.ofEpochMilli(n.asLong());
          } catch (RuntimeException ignored2) {
            // fall through
          }
        }
      }
    }
    return null;
  }
}

/** ModivCare payload shape (documented intake format — no live API). */
@Component
class ModivCareAdapter extends BrokerAdapters implements BrokerAdapter {
  @Override
  public String broker() { return "MODIVCARE"; }

  @Override
  public NormalizedBrokerTrip normalize(JsonNode p) {
    String id = text(p, "tripId", "trip_id", "externalTripId", "brokerTripId");
    String rider = text(p, "memberName", "riderName", "patientName", "member");
    if (id == null || rider == null) {
      return null;
    }
    String mobility = text(p, "mobility", "transportMode", "mode");
    boolean wheelchair = bool(p, "wheelchair", "wheelchairRequired")
        || "wheelchair".equalsIgnoreCase(mobility);
    return new NormalizedBrokerTrip(
        id, rider,
        text(p, "pickupAddress", "pickup", "originAddress"),
        text(p, "dropoffAddress", "dropoff", "destinationAddress"),
        instant(p, "scheduledAt", "pickupTime", "appointmentTime"),
        wheelchair ? "wheelchair" : (mobility == null ? "ambulatory" : mobility.toLowerCase()),
        wheelchair);
  }
}

/** MTM payload shape (documented intake format — no live API). */
@Component
class MtmAdapter extends BrokerAdapters implements BrokerAdapter {
  @Override
  public String broker() { return "MTM"; }

  @Override
  public NormalizedBrokerTrip normalize(JsonNode p) {
    String id = text(p, "tripId", "trip_id", "externalTripId", "brokerTripId", "legId");
    String rider = text(p, "rider", "riderName", "patientName", "memberName");
    if (id == null || rider == null) {
      return null;
    }
    String mobility = text(p, "mobility", "levelOfService", "transportType");
    boolean wheelchair = bool(p, "wheelchair", "wheelchairRequired")
        || (mobility != null && mobility.toLowerCase().contains("wheelchair"));
    return new NormalizedBrokerTrip(
        id, rider,
        text(p, "pickupAddress", "pickup", "origin"),
        text(p, "dropoffAddress", "dropoff", "destination"),
        instant(p, "scheduledAt", "pickupTime", "scheduledTime"),
        wheelchair ? "wheelchair" : (mobility == null ? "ambulatory" : mobility.toLowerCase()),
        wheelchair);
  }
}

/** Verida payload shape (documented intake format — no live API). */
@Component
class VeridaAdapter extends BrokerAdapters implements BrokerAdapter {
  @Override
  public String broker() { return "VERIDA"; }

  @Override
  public NormalizedBrokerTrip normalize(JsonNode p) {
    String id = text(p, "tripId", "trip_id", "externalTripId", "brokerTripId", "reservationId");
    String rider = text(p, "passenger", "passengerName", "riderName", "patientName");
    if (id == null || rider == null) {
      return null;
    }
    String mobility = text(p, "mobility", "vehicleType", "serviceLevel");
    boolean wheelchair = bool(p, "wheelchair", "wheelchairRequired")
        || (mobility != null && mobility.toLowerCase().contains("wheelchair"));
    return new NormalizedBrokerTrip(
        id, rider,
        text(p, "pickupAddress", "pickup", "originAddress"),
        text(p, "dropoffAddress", "dropoff", "destinationAddress"),
        instant(p, "scheduledAt", "pickupTime", "requestedTime"),
        wheelchair ? "wheelchair" : (mobility == null ? "ambulatory" : mobility.toLowerCase()),
        wheelchair);
  }
}
