package com.fleetos.api;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetos.api.domain.TrackingToken;
import com.fleetos.api.repo.TrackingTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Phase 3 flows against the H2 test profile: broker intake + import,
 * billing/claims lifecycle, rider tracking links, notifications on trip
 * completion, binary proof upload (incl. the billable-evidence mapping),
 * and OIG/SAM/MVR compliance checks (SIMULATED, honestly labelled).
 *
 * The frontend outbox retro-queue (failed online call → outbox → flush)
 * is a browser-side behaviour with no browser in this sandbox; its
 * server side (the outbox flush itself) is covered by Phase2 tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase3IntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private TrackingTokenRepository trackingTokens;

  private String login(String email, String password) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}"))
        .andExpect(status().isOk())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString())
        .get("token").asText();
  }

  private String createTrip(String token, String driverCode) throws Exception {
    String body = """
        {"riderName": "Test Rider", "pickupAddress": "500 E Hampden Ave, Englewood, CO",
         "pickupLat": 39.6536, "pickupLng": -104.9878,
         "dropoffAddress": "1420 S Pearl St, Denver, CO",
         "dropoffLat": 39.6912, "dropoffLng": -104.9801,
         "mobility": "ambulatory", "driverCode": "%s", "wheelchair": false}"""
        .formatted(driverCode);
    MvcResult result = mockMvc.perform(post("/api/trips")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
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

  // ------------------------------------------------------------------ brokers

  private static final String MODIVCARE_PAYLOAD = """
      {"tripId": "MC-9001", "memberName": "Ada Lovelace",
       "pickupAddress": "100 Main St, Denver, CO", "dropoffAddress": "200 Clinic Rd, Aurora, CO",
       "scheduledAt": "2026-11-12T14:00:00Z", "mobility": "ambulatory"}""";

  @Test
  void brokerIntakeDedupesAndImportCreatesRealTrip() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");

    // First intake → RECEIVED.
    MvcResult first = mockMvc.perform(post("/api/brokers/MODIVCARE/intake")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(MODIVCARE_PAYLOAD))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("RECEIVED"))
        .andExpect(jsonPath("$.brokerTripId").value("MC-9001"))
        .andReturn();
    String intakeId = objectMapper.readTree(first.getResponse().getContentAsString())
        .get("id").asText();

    // Same payload again → DUPLICATE, never a second record.
    mockMvc.perform(post("/api/brokers/MODIVCARE/intake")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(MODIVCARE_PAYLOAD))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("DUPLICATE"));

    // Unknown broker → 400.
    mockMvc.perform(post("/api/brokers/FAKEBROKER/intake")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content(MODIVCARE_PAYLOAD))
        .andExpect(status().isBadRequest());

    // Import → a real trip exists.
    MvcResult imported = mockMvc.perform(post("/api/brokers/MODIVCARE/trips/" + intakeId + "/import")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.riderName").value("Ada Lovelace"))
        .andReturn();
    String tripCode = objectMapper.readTree(imported.getResponse().getContentAsString())
        .get("code").asText();
    mockMvc.perform(get("/api/trips/" + tripCode)
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.riderName").value("Ada Lovelace"));

    // Brokers list is honest: NOT_CONNECTED with credentials_required.
    mockMvc.perform(get("/api/brokers")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.broker=='MODIVCARE')].status").value("NOT_CONNECTED"))
        .andExpect(jsonPath("$[?(@.broker=='MODIVCARE')].connectionRequirement")
            .value("credentials_required"));
  }

  // ------------------------------------------------------------------ billing

  @Test
  void claimFromNonBillableTripIs409() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String code = createTrip(admin, "DRV-101"); // ASSIGNED, not completed
    mockMvc.perform(post("/api/billing/claims/from-trip/" + code)
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isConflict());
  }

  @Test
  void claimLifecycleDraftSubmittedPaidAndInvoiceCreated() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    // TRP-100 is seeded COMPLETED + billable.
    MvcResult created = mockMvc.perform(post("/api/billing/claims/from-trip/TRP-100")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"broker\": \"MODIVCARE\", \"payer\": \"ModivCare\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("DRAFT"))
        .andExpect(jsonPath("$.amount").value(45.00))
        .andExpect(jsonPath("$.tripCode").value("TRP-100"))
        .andReturn();
    JsonNode claim = objectMapper.readTree(created.getResponse().getContentAsString());
    String claimId = claim.get("id").asText();

    // CMS-1500 structured data, with placeholders listed.
    mockMvc.perform(get("/api/billing/claims/" + claimId + "/cms1500")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.cms1500.form").value("CMS-1500 (02/12)"))
        .andExpect(jsonPath("$.cms1500.placeholders").isArray())
        .andExpect(jsonPath("$.cms1500.boxes.box2_patientName").value("Robert Chen"));

    // DRAFT → SUBMITTED creates the invoice.
    mockMvc.perform(post("/api/billing/claims/" + claimId + "/submit")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("SUBMITTED"));
    mockMvc.perform(get("/api/billing/invoices")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].claimNumber").value(claim.get("claimNumber").asText()))
        .andExpect(jsonPath("$[0].status").value("SENT"));

    // SUBMITTED → PAID.
    mockMvc.perform(post("/api/billing/claims/" + claimId + "/mark-paid")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("PAID"));

    // A second claim for the same trip → 409.
    mockMvc.perform(post("/api/billing/claims/from-trip/TRP-100")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isConflict());
  }

  private void completeTripWithJsonProof(String token, String code) throws Exception {
    changeStatus(token, code,
        "{\"status\": \"en_route_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(token, code,
        "{\"status\": \"arrived_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(token, code,
        "{\"status\": \"in_transit\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\"}", 200);
    changeStatus(token, code,
        "{\"status\": \"completed\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\","
            + "\"odometerEnd\": 124600, \"passengerSignature\": true, \"driverSignature\": true}", 200);
  }

  @Test
  void claimDeniedNotifiesDispatchers() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String driver = login("driver@nemtos.com", "driver123");
    // Own completed trip (TRP-100 is claimed by another test in this class).
    String code = createTrip(admin, "DRV-101");
    completeTripWithJsonProof(driver, code);
    MvcResult created = mockMvc.perform(post("/api/billing/claims/from-trip/" + code)
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isCreated())
        .andReturn();
    String claimId = objectMapper.readTree(created.getResponse().getContentAsString())
        .get("id").asText();
    mockMvc.perform(post("/api/billing/claims/" + claimId + "/mark-denied")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"reason\": \"Missing signature on file\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("DENIED"))
        .andExpect(jsonPath("$.denialReason").value("Missing signature on file"));
    mockMvc.perform(get("/api/notifications")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='CLAIM_DENIED')].title").exists());
  }

  // ----------------------------------------------------------------- tracking

  @Test
  void trackingLinkPublicSubsetAndInvalidAndExpiredAre404() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    MvcResult link = mockMvc.perform(post("/api/trips/TRP-100/tracking-link")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.token").exists())
        .andReturn();
    String token = objectMapper.readTree(link.getResponse().getContentAsString())
        .get("token").asText();

    // Public view, no auth: safe subset only — no phone, no full address.
    String body = mockMvc.perform(get("/api/public/tracking/" + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tripCode").value("TRP-100"))
        .andExpect(jsonPath("$.status").value("COMPLETED"))
        .andExpect(jsonPath("$.driverFirstName").value("Marcus"))
        .andExpect(jsonPath("$.pickupArea").value("Denver, CO"))
        .andReturn().getResponse().getContentAsString();
    org.junit.jupiter.api.Assertions.assertFalse(body.contains("555-0199"),
        "public tracking must not leak the rider phone number");
    org.junit.jupiter.api.Assertions.assertFalse(body.contains("1000 Speer Blvd"),
        "public tracking must not leak the full pickup address");

    // Unknown token → 404.
    mockMvc.perform(get("/api/public/tracking/does-not-exist"))
        .andExpect(status().isNotFound());

    // Expired token → 404 (move the stored token's expiry into the past).
    TrackingToken stored = trackingTokens.findByToken(token).orElseThrow();
    stored.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
    trackingTokens.save(stored);
    mockMvc.perform(get("/api/public/tracking/" + token))
        .andExpect(status().isNotFound());
  }

  // ------------------------------------------------------------ notifications

  @Test
  void tripCompletionCreatesNotificationForDispatchers() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String driver = login("driver@nemtos.com", "driver123");
    String code = createTrip(admin, "DRV-101");

    // Driver is notified of the assignment.
    mockMvc.perform(get("/api/notifications")
            .header("Authorization", "Bearer " + driver))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='TRIP_ASSIGNED')].tripCode", hasItem(code)));

    changeStatus(driver, code,
        "{\"status\": \"en_route_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(driver, code,
        "{\"status\": \"arrived_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(driver, code,
        "{\"status\": \"in_transit\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\"}", 200);
    changeStatus(driver, code,
        "{\"status\": \"completed\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\","
            + "\"odometerEnd\": 124600, \"passengerSignature\": true, \"driverSignature\": true}", 200);

    mockMvc.perform(get("/api/notifications")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='TRIP_COMPLETED')].tripCode", hasItem(code)));

    // Unread count + mark read.
    mockMvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unread").isNumber());
    mockMvc.perform(post("/api/notifications/read-all")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk());
    mockMvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.unread").value(0));
  }

  // ------------------------------------------------------------- proof upload

  @Test
  void proofUploadRejectsNonImageAndAcceptsImageAndSatisfiesBillable() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    String driver = login("driver@nemtos.com", "driver123");
    String code = createTrip(admin, "DRV-101");

    // Non-image file → 400.
    mockMvc.perform(multipart("/api/trips/" + code + "/proof/upload")
            .file(new MockMultipartFile("file", "notes.txt", "text/plain", "hello".getBytes()))
            .param("kind", "ODOMETER")
            .header("Authorization", "Bearer " + driver))
        .andExpect(status().isBadRequest());

    // Bad kind → 400.
    mockMvc.perform(multipart("/api/trips/" + code + "/proof/upload")
            .file(new MockMultipartFile("file", "sig.png", "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'}))
            .param("kind", "WRONG_KIND")
            .header("Authorization", "Bearer " + driver))
        .andExpect(status().isBadRequest());

    // Three binary files: odometer photo + both signatures.
    byte[] png = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    for (String kind : new String[]{"ODOMETER", "SIGNATURE_DRIVER", "SIGNATURE_PASSENGER"}) {
      mockMvc.perform(multipart("/api/trips/" + code + "/proof/upload")
              .file(new MockMultipartFile("file", "proof.png", "image/png", png))
              .param("kind", kind)
              .header("Authorization", "Bearer " + driver))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.kind").value(kind));
    }

    // Binary evidence alone satisfies the COMPLETED gate — no JSON proof needed.
    changeStatus(driver, code,
        "{\"status\": \"en_route_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(driver, code,
        "{\"status\": \"arrived_pickup\", \"lat\": 39.6536, \"lng\": -104.9878, \"gpsSource\": \"device\"}", 200);
    changeStatus(driver, code,
        "{\"status\": \"in_transit\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\"}", 200);
    MvcResult completed = mockMvc.perform(post("/api/trips/" + code + "/status")
            .header("Authorization", "Bearer " + driver)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\": \"completed\", \"lat\": 39.6912, \"lng\": -104.9801, \"gpsSource\": \"device\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.billable").value(true))
        .andReturn();

    // Files list + download work.
    mockMvc.perform(get("/api/trips/" + code + "/proof/files")
            .header("Authorization", "Bearer " + driver))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3));
    String fileId = objectMapper.readTree(
            mockMvc.perform(get("/api/trips/" + code + "/proof/files")
                    .header("Authorization", "Bearer " + driver))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString())
        .get(0).get("id").asText();
    mockMvc.perform(get("/api/proof-files/" + fileId)
            .header("Authorization", "Bearer " + driver))
        .andExpect(status().isOk());
  }

  // --------------------------------------------------------------- compliance

  @Test
  void complianceRunCheckIsSimulatedAndVisible() throws Exception {
    String admin = login("admin@nemtos.com", "admin123");
    mockMvc.perform(post("/api/drivers/DRV-101/compliance/run-check")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"checkType\": \"OIG\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.source").value("SIMULATED"))
        .andExpect(jsonPath("$.result").value("CLEAR"));
    mockMvc.perform(get("/api/drivers/DRV-101/compliance")
            .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.oigStatus").value("CLEAR"))
        .andExpect(jsonPath("$.history[0].source").value("SIMULATED"))
        .andExpect(jsonPath("$.disclaimer").exists());

    // Batch run (Audit Shield scan button) covers every driver.
    mockMvc.perform(post("/api/drivers/compliance/run-check")
            .header("Authorization", "Bearer " + admin)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"checkType\": \"SAM\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.scannedCount").value(3))
        .andExpect(jsonPath("$.source").value("SIMULATED"));
  }
}
