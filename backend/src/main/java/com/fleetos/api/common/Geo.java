package com.fleetos.api.common;

/** Haversine distance + drive-time ETA. Same math as the frontend's trip.model. */
public final class Geo {

  private static final double EARTH_RADIUS_MILES = 3958.8;

  private Geo() {}

  public static double haversineMiles(double lat1, double lng1, double lat2, double lng2) {
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
  }

  /** Rough drive-time ETA in minutes at an assumed 30 mph city speed. */
  public static int etaMinutesForMiles(double miles) {
    return Math.max(1, (int) Math.round((miles / 30.0) * 60));
  }
}
