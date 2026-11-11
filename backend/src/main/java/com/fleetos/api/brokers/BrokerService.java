package com.fleetos.api.brokers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.BrokerConnection;
import com.fleetos.api.domain.BrokerTrip;
import com.fleetos.api.domain.Role;
import com.fleetos.api.repo.BrokerConnectionRepository;
import com.fleetos.api.repo.BrokerTripRepository;
import com.fleetos.api.trips.TripDtos.CreateTripRequest;
import com.fleetos.api.trips.TripDtos.TripResponse;
import com.fleetos.api.trips.TripService;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Broker integrations — intake + mapping layer only. There is no live
 * broker API connection: ModivCare / MTM / Verida all need broker-issued
 * credentials and approval, which do not exist here. What is real:
 * <ul>
 *   <li>intake validates + normalises a broker payload into the app's Trip
 *       model (via the per-broker adapter) and dedupes by broker trip id</li>
 *   <li>import creates a real Trip through TripService — DQF eligibility
 *       is enforced exactly as for a hand-created trip</li>
 *   <li>broker_connections reports the honest status (NOT_CONNECTED) with
 *       a credentials_required note, so the UI never pretends otherwise</li>
 * </ul>
 * Going live with a broker means: obtain API credentials from the broker,
 * implement a fetcher that polls/pushes their trips and hands each payload
 * to the adapter, then flip the connection row to CONNECTED.
 */
@Service
public class BrokerService {

  public static final List<String> KNOWN_BROKERS = List.of("MODIVCARE", "MTM", "VERIDA");

  private static final Map<String, String> CONNECTION_NOTES = Map.of(
      "MODIVCARE", "Broker API credentials required — contact ModivCare provider services to obtain API access.",
      "MTM", "Broker API credentials required — contact MTM to obtain API access.",
      "VERIDA", "Broker API credentials required — contact Verida to obtain API access.");

  private final BrokerTripRepository brokerTrips;
  private final BrokerConnectionRepository connections;
  private final TripService tripService;
  private final ObjectMapper objectMapper;
  private final List<BrokerAdapter> adapters;

  public BrokerService(BrokerTripRepository brokerTrips,
      BrokerConnectionRepository connections, TripService tripService,
      ObjectMapper objectMapper, List<BrokerAdapter> adapters) {
    this.brokerTrips = brokerTrips;
    this.connections = connections;
    this.tripService = tripService;
    this.objectMapper = objectMapper;
    this.adapters = adapters;
  }

  public static String normalizeBroker(String broker) {
    if (broker == null) {
      throw ApiException.badRequest("broker is required");
    }
    String key = broker.trim().toUpperCase();
    if (!KNOWN_BROKERS.contains(key)) {
      throw ApiException.badRequest("Unknown broker: " + broker
          + " (known brokers: ModivCare, MTM, Verida)");
    }
    return key;
  }

  public static void requireDispatcher(AppUser user) {
    if (user.getRole() != Role.ADMIN && user.getRole() != Role.DISPATCHER) {
      throw ApiException.forbidden("Only dispatchers and admins can do this");
    }
  }

  /** Connection rows for all known brokers, creating NOT_CONNECTED rows on first use. */
  @Transactional
  public List<BrokerConnection> listConnections(AppUser user) {
    for (String broker : KNOWN_BROKERS) {
      connections.findByWorkspaceIdAndBroker(user.getWorkspace().getId(), broker)
          .orElseGet(() -> connections.save(new BrokerConnection(
              user.getWorkspace(), broker, CONNECTION_NOTES.get(broker))));
    }
    return connections.findByWorkspaceIdOrderByBrokerAsc(user.getWorkspace().getId());
  }

  private BrokerAdapter adapterFor(String broker) {
    return adapters.stream()
        .filter(a -> a.broker().equals(broker))
        .findFirst()
        .orElseThrow(() -> ApiException.badRequest("No adapter for broker: " + broker));
  }

  /** Accept a broker trip payload, validate + normalise it, dedupe by broker trip id. */
  @Transactional
  public BrokerTrip intake(AppUser user, String brokerKey, JsonNode payload) {
    requireDispatcher(user);
    BrokerAdapter adapter = adapterFor(brokerKey);
    BrokerAdapter.NormalizedBrokerTrip normalized = adapter.normalize(payload);
    if (normalized == null) {
      throw ApiException.badRequest(
          "Broker payload is missing required fields (broker trip id and rider name)");
    }
    return brokerTrips.findByWorkspaceIdAndBrokerAndBrokerTripId(
            user.getWorkspace().getId(), brokerKey, normalized.brokerTripId())
        .map(existing -> {
          existing.setStatus("DUPLICATE");
          return brokerTrips.save(existing);
        })
        .orElseGet(() -> {
          BrokerTrip intake = new BrokerTrip(user.getWorkspace(), brokerKey, normalized.brokerTripId());
          intake.setRawPayload(payload.toString());
          intake.setRiderName(normalized.riderName());
          intake.setPickupAddress(normalized.pickupAddress());
          intake.setDropoffAddress(normalized.dropoffAddress());
          intake.setScheduledAt(normalized.scheduledAt());
          intake.setMobility(normalized.mobility());
          intake.setWheelchair(normalized.wheelchair());
          return brokerTrips.save(intake);
        });
  }

  @Transactional(readOnly = true)
  public List<BrokerTrip> listIntake(AppUser user, String brokerKey, String status) {
    List<BrokerTrip> all = brokerTrips.findByWorkspaceIdAndBrokerOrderByCreatedAtDesc(
        user.getWorkspace().getId(), brokerKey);
    if (status == null || status.isBlank()) {
      return all;
    }
    return all.stream()
        .filter(t -> status.equalsIgnoreCase(t.getStatus()))
        .toList();
  }

  /** Import one intake record into a real Trip (DQF check still applies). */
  @Transactional
  public TripResponse importIntake(AppUser user, String brokerKey, java.util.UUID intakeId) {
    requireDispatcher(user);
    BrokerTrip intake = brokerTrips.findById(intakeId)
        .filter(t -> t.getWorkspace().getId().equals(user.getWorkspace().getId())
            && t.getBroker().equals(brokerKey))
        .orElseThrow(() -> ApiException.notFound("Broker trip"));
    if (intake.getImportedTrip() != null) {
      throw ApiException.conflict("Broker trip already imported",
          Map.of("tripCode", intake.getImportedTrip().getCode()));
    }
    try {
      TripResponse created = tripService.createTrip(user, new CreateTripRequest(
          null,
          intake.getRiderName(),
          null,
          intake.getMobility(),
          intake.getPickupAddress(), null, null,
          intake.getDropoffAddress(), null, null,
          intake.getScheduledAt(),
          null, null,
          intake.isWheelchair(), null));
      // Reload the trip to link it (createTrip returns a DTO, not the entity).
      intake.setImportedTrip(tripService.resolveTrip(user, created.code()));
      intake.setStatus("IMPORTED");
      intake.setImportError(null);
      brokerTrips.save(intake);
      return created;
    } catch (ApiException ex) {
      intake.setStatus("REJECTED");
      intake.setImportError(ex.getMessage());
      brokerTrips.save(intake);
      throw ex;
    }
  }

  public BrokerConnectionResponse toConnectionResponse(BrokerConnection c) {
    return new BrokerConnectionResponse(
        c.getBroker(), c.getStatus(), c.isCredentialsConfigured(),
        c.getNote(), "credentials_required");
  }

  public BrokerTripResponse toTripResponse(BrokerTrip t) {
    return new BrokerTripResponse(
        t.getId(), t.getBroker(), t.getBrokerTripId(), t.getStatus(),
        t.getRiderName(), t.getPickupAddress(), t.getDropoffAddress(),
        t.getScheduledAt(), t.getMobility(), t.isWheelchair(),
        t.getImportedTrip() == null ? null : t.getImportedTrip().getCode(),
        t.getImportError(), t.getCreatedAt());
  }

  public record BrokerConnectionResponse(
      String broker, String status, boolean credentialsConfigured,
      String note, String connectionRequirement) {}

  public record BrokerTripResponse(
      java.util.UUID id, String broker, String brokerTripId, String status,
      String riderName, String pickupAddress, String dropoffAddress,
      java.time.Instant scheduledAt, String mobility, boolean wheelchair,
      String importedTripCode, String importError, java.time.Instant createdAt) {}
}
