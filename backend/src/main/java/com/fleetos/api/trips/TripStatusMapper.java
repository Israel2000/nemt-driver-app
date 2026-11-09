package com.fleetos.api.trips;

import com.fleetos.api.common.ApiException;
import com.fleetos.api.domain.TripStatus;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Maps between the frontend's status vocabulary and the backend enum, and
 * owns the legal-transition table. The frontend uses
 * scheduled / en_route_pickup / arrived_pickup / in_transit / completed /
 * cancelled / no_show / delayed; the backend enum is ASSIGNED / EN_ROUTE /
 * ARRIVED / BOARDED / COMPLETED / NO_SHOW / CANCELLED / DELAYED.
 */
public final class TripStatusMapper {

  private static final Map<TripStatus, Set<TripStatus>> LEGAL = new EnumMap<>(TripStatus.class);

  static {
    LEGAL.put(TripStatus.ASSIGNED, EnumSet.of(TripStatus.EN_ROUTE, TripStatus.CANCELLED, TripStatus.DELAYED));
    LEGAL.put(TripStatus.EN_ROUTE, EnumSet.of(TripStatus.ARRIVED, TripStatus.NO_SHOW, TripStatus.CANCELLED, TripStatus.DELAYED));
    LEGAL.put(TripStatus.ARRIVED, EnumSet.of(TripStatus.BOARDED, TripStatus.NO_SHOW, TripStatus.CANCELLED, TripStatus.DELAYED));
    LEGAL.put(TripStatus.BOARDED, EnumSet.of(TripStatus.COMPLETED, TripStatus.CANCELLED, TripStatus.DELAYED));
    // DELAYED is a hold: the trip resumes into its next live status.
    LEGAL.put(TripStatus.DELAYED, EnumSet.of(TripStatus.EN_ROUTE, TripStatus.ARRIVED, TripStatus.BOARDED, TripStatus.NO_SHOW, TripStatus.CANCELLED));
    LEGAL.put(TripStatus.COMPLETED, EnumSet.noneOf(TripStatus.class));
    LEGAL.put(TripStatus.NO_SHOW, EnumSet.noneOf(TripStatus.class));
    LEGAL.put(TripStatus.CANCELLED, EnumSet.noneOf(TripStatus.class));
  }

  private TripStatusMapper() {}

  /** Accepts a frontend status string or a backend enum name (case-insensitive). */
  public static TripStatus fromFrontend(String value) {
    if (value == null) {
      throw ApiException.badRequest("status is required");
    }
    switch (value.trim().toLowerCase()) {
      case "scheduled":
      case "assigned":
        return TripStatus.ASSIGNED;
      case "en_route_pickup":
      case "en_route":
        return TripStatus.EN_ROUTE;
      case "arrived_pickup":
      case "arrived":
        return TripStatus.ARRIVED;
      case "in_transit":
      case "boarded":
        return TripStatus.BOARDED;
      case "completed":
        return TripStatus.COMPLETED;
      case "cancelled":
        return TripStatus.CANCELLED;
      case "no_show":
        return TripStatus.NO_SHOW;
      case "delayed":
        return TripStatus.DELAYED;
      default:
        throw ApiException.badRequest("Unknown trip status: " + value);
    }
  }

  public static String toFrontend(TripStatus status) {
    switch (status) {
      case ASSIGNED: return "scheduled";
      case EN_ROUTE: return "en_route_pickup";
      case ARRIVED: return "arrived_pickup";
      case BOARDED: return "in_transit";
      case COMPLETED: return "completed";
      case NO_SHOW: return "no_show";
      case CANCELLED: return "cancelled";
      case DELAYED: return "delayed";
      default: throw new IllegalArgumentException("Unknown status " + status);
    }
  }

  public static boolean isLegal(TripStatus from, TripStatus to) {
    return LEGAL.getOrDefault(from, Set.of()).contains(to);
  }
}
