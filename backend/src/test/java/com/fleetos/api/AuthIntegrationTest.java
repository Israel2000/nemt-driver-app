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
 * Auth flow against the H2 test profile (see application-test.yml).
 * The DataSeeder seeds the demo admin, so login with the demo credentials
 * must succeed and a wrong password must 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void loginWithSeededAdminSucceedsAndReturnsJwt() throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email": "admin@nemtos.com", "password": "admin123"}"""))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.user.email").value("admin@nemtos.com"))
        .andExpect(jsonPath("$.user.role").value("admin"))
        .andExpect(jsonPath("$.workspace.id").value("ws-metro-01"))
        .andReturn();

    String token = objectMapper.readTree(result.getResponse().getContentAsString())
        .get("token").asText();

    mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.email").value("admin@nemtos.com"));
  }

  @Test
  void loginWithWrongPasswordReturns401() throws Exception {
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email": "admin@nemtos.com", "password": "wrong-password"}"""))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void meWithoutTokenReturns401() throws Exception {
    mockMvc.perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void registerCreatesWorkspaceAndAdmin() throws Exception {
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"companyName": "Test Transit LLC", "email": "owner@testtransit.com",
                 "password": "secret123", "fullName": "Test Owner"}"""))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.user.email").value("owner@testtransit.com"))
        .andExpect(jsonPath("$.workspace.name").value("Test Transit LLC"));
  }

  @Test
  void registerWithDuplicateEmailReturns409() throws Exception {
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"companyName": "Dup LLC", "email": "admin@nemtos.com",
                 "password": "secret123"}"""))
        .andExpect(status().isConflict());
  }
}
