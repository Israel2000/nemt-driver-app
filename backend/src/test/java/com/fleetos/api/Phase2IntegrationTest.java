package com.fleetos.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Phase 2 flows against the H2 test profile (application-test.yml):
 * trip lifecycle + gates, DQF-blocked dispatch, outbox idempotency, and
 * workspace scoping. The DataSeeder seeds the demo workspace (ws-metro-01)
 * with Marcus (DRV-101, licence warning only) and Darnell (DRV-103,
 * expired CPR + licence).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase2IntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  private String login(String email, String password) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}"))
        .andExpect(status().isOk())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString())
        .get("token").asText();
  }

  private String createTrip(String token, String driverCode, boolean wheelchair) throws Exception {
    String body = """
        {"riderName": "Test Rider", "pickupAddress": "500 E Hampden Ave, Englewood, CO",
         "pickupLat": 39.6536, "pickupLng": -104.9878,
         "dropoffAddress": "1420 S Pearl St, Denver, CO",
         "dropoffLat": 39.6912, "dropoffLng": -104.9801,
         "mobility": "%s", "driverCode": "%s", "wheelchair": %s}"""
        .formatted(wheelchair ? "wheelchair" : "ambulatory", driverCode, wheelchair);
    MvcResult result = mockMvc.perform(post("/api/trips")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.code").exists())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString())
        .get("code").asText();
  }

  private void changeStatus(String token, String code, String body, int expectedStatus) throws Exception {
    mockMvc.perform(post("/api/trips/" + code + "/status")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().is(expectedStatus));
  }

  @Test
  void tripLifecycleHappyPathWithProofIsBillable() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", true);

    changeStatus(admin, code, """
        {"status": "en_route_pickup", "lat": 39.6536, "lng": -104.9878, "gpsSource": "device"}""", 200);
    changeStatus(admin, code, """
        {"status": "arrived_pickup", "lat": 39.6536, "lng": -104.9878, "gpsSource": "device"}""", 200);

    // Wheelchair trip cannot board before the securement checklist.
    changeStatus(admin, code, """
        {"status": "in_transit"}""", 409);
    mockMvc.perform(post("/api/trips/" + code + "/securement")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"positioned": true, "tieDownFrontLeft": true, "tieDownFrontRight": true,
                 "tieDownRearLeft": true, "tieDownRearRight": true, "brakesSet": true,
                 "lapBelt": true, "shoulderBelt": true, "completedBy": "Marcus Vance"}"""))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.complete").value(true));

    changeStatus(admin, code, """
        {"status": "in_transit"}""", 200);
    // Completing without proof is rejected.
    changeStatus(admin, code, """
        {"status": "completed"}""", 409);
    // Completing with odometer + both signatures is billable.
    mockMvc.perform(post("/api/trips/" + code + "/status")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"status": "completed", "lat": 39.6912, "lng": -104.9801, "gpsSource": "device",
                 "odometerEnd": 124599, "passengerSignature": true,
                 "passengerSignatureData": "data:image/png;base64,AAA",
                 "driverSignature": true, "driverSignatureData": "data:image/png;base64,BBB",
                 "signeeName": "Eleanor Vance", "signeeType": "patient"}"""))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("COMPLETED"))
        .andExpect(jsonPath("$.billable").value(true));

    // Status history recorded the whole journey.
    mockMvc.perform(get("/api/trips/" + code + "/events")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(4));
  }

  @Test
  void illegalTransitionReturns400() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);
    // ASSIGNED cannot jump straight to COMPLETED.
    changeStatus(admin, code, """
        {"status": "completed"}""", 400);
  }

  @Test
  void assignToExpiredDriverReturns403() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    // Darnell Washington (DRV-103) has an expired CPR card + licence.
    mockMvc.perform(post("/api/trips")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"riderName": "Blocked Rider", "driverCode": "DRV-103"}"""))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("driver_blocked"))
        .andExpect(jsonPath("$.reasons").isArray());
    // The eligibility endpoint says the same thing.
    mockMvc.perform(get("/api/dispatch/eligibility?driverId=DRV-103")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eligible").value(false))
        .andExpect(jsonPath("$.dqfStatus").value("EXPIRED"));
    mockMvc.perform(get("/api/dispatch/eligibility?driverId=DRV-101")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eligible").value(true));
  }

  @Test
  void arrivedFarFromPickupNeedsConfirm() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);
    changeStatus(admin, code, """
        {"status": "en_route_pickup"}""", 200);
    // 5+ miles from the pickup on a live fix: 409 with a warning payload.
    mockMvc.perform(post("/api/trips/" + code + "/status")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"status": "arrived_pickup", "lat": 39.7392, "lng": -104.9903, "gpsSource": "device"}"""))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.requiresConfirm").value(true));
    // Same fix with confirm=true proceeds.
    changeStatus(admin, code, """
        {"status": "arrived_pickup", "lat": 39.7392, "lng": -104.9903, "gpsSource": "device", "confirm": true}""", 200);
  }

  @Test
  void outboxFlushIsIdempotent() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);
    String batch = """
        {"events": [
          {"clientEventId": "ev-p2-test-1", "kind": "status", "tripId": "%s",
           "payload": {"status": "en_route_pickup", "lat": 39.6536, "lng": -104.9878, "gpsSource": "device"}},
          {"clientEventId": "ev-p2-test-2", "kind": "message", "tripId": "%s",
           "payload": {"body": "Running about 10 minutes late — traffic.", "fromName": "Dispatch"}}
        ]}""".formatted(code, code);
    mockMvc.perform(post("/api/sync/outbox")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(batch))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.results[0].result").value("APPLIED"))
        .andExpect(jsonPath("$.results[1].result").value("APPLIED"));
    // Flushing the exact same batch again must not double-apply.
    mockMvc.perform(post("/api/sync/outbox")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(batch))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.results[0].result").value("DUPLICATE"))
        .andExpect(jsonPath("$.results[1].result").value("DUPLICATE"));
    // And the status moved exactly once.
    mockMvc.perform(get("/api/trips/" + code + "/events")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));
    mockMvc.perform(get("/api/trips/" + code + "/messages")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  void outboxRejectedEventDoesNotFailTheBatch() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);
    // First event is an illegal transition (ASSIGNED → COMPLETED) and must
    // be REJECTED; the batch must still apply the second event.
    String batch = """
        {"events": [
          {"clientEventId": "ev-p2-test-3", "kind": "status", "tripId": "%s",
           "payload": {"status": "completed"}},
          {"clientEventId": "ev-p2-test-4", "kind": "message", "tripId": "%s",
           "payload": {"body": "Applied after a rejection.", "fromName": "Dispatch"}}
        ]}""".formatted(code, code);
    mockMvc.perform(post("/api/sync/outbox")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(batch))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.results[0].result").value("REJECTED"))
        .andExpect(jsonPath("$.results[1].result").value("APPLIED"));
    mockMvc.perform(get("/api/trips/" + code + "/messages")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  void outboxAssignmentWithFullPayloadCreatesTrip() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    // A trip created offline carries the full frontend-shaped payload;
    // the server must create it (patientName → riderName mapping).
    String batch = """
        {"events": [
          {"clientEventId": "ev-p2-test-5", "kind": "assignment", "tripId": "TRP-900",
           "payload": {"code": "TRP-900", "patientName": "Offline Rider", "pickupAddress": "1000 Speer Blvd, Denver, CO",
                       "pickupLat": 39.7340, "pickupLng": -104.9975,
                       "dropoffAddress": "8300 E 9th Ave, Denver, CO",
                       "dropoffLat": 39.7301, "dropoffLng": -104.8900,
                       "mobility": "ambulatory", "driverCode": "DRV-102"}}
        ]}""";
    mockMvc.perform(post("/api/sync/outbox")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(batch))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.results[0].result").value("APPLIED"));
    mockMvc.perform(get("/api/trips/TRP-900")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.riderName").value("Offline Rider"))
        .andExpect(jsonPath("$.driverId").value("DRV-102"));
  }

  @Test
  void workspaceScopingHidesOtherWorkspacesTrips() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);

    // A user from a different workspace (registered fresh) must not see it.
    MvcResult reg = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"companyName": "Other Transit LLC", "email": "owner@othertransit.com",
                 "password": "secret123"}"""))
        .andExpect(status().isCreated())
        .andReturn();
    String otherToken = objectMapper.readTree(reg.getResponse().getContentAsString())
        .get("token").asText();

    mockMvc.perform(get("/api/trips/" + code)
            .header("Authorization", "Bearer " + otherToken))
        .andExpect(status().isNotFound());
    mockMvc.perform(get("/api/trips")
            .header("Authorization", "Bearer " + otherToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void driverDqfEndpointShowsLiveStatus() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    mockMvc.perform(get("/api/drivers/DRV-103/dqf")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dqfStatus").value("EXPIRED"))
        .andExpect(jsonPath("$.credentials.length()").value(2));
    mockMvc.perform(get("/api/drivers")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3));
  }

  @Test
  void etaIsLabelledEstimate() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101", false);
    mockMvc.perform(get("/api/trips/" + code + "/eta?to=dropoff")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estimate").value(true))
        .andExpect(jsonPath("$.minutes").exists());
  }
}
