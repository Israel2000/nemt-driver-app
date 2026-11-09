package com.fleetos.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * JWT issuing + parsing. The signing secret comes from the JWT_SECRET env var.
 * The application.yml default is a DEV-ONLY placeholder — set a long random
 * secret in production (see backend/README.md).
 */
@Component
public class JwtService {

  private final SecretKey key;
  private final long expirationMs;

  public JwtService(
      @Value("${app.jwt.secret:dev-only-change-me-in-production-use-a-long-random-secret-0123456789abcdef}")
      String secret,
      @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  public String generateToken(String subject, String workspaceId, String role) {
    Date now = new Date();
    return Jwts.builder()
        .subject(subject)
        .claim("workspaceId", workspaceId)
        .claim("role", role)
        .issuedAt(now)
        .expiration(new Date(now.getTime() + expirationMs))
        .signWith(key)
        .compact();
  }

  public Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  public String extractSubject(String token) {
    return parseClaims(token).getSubject();
  }

  public boolean isValid(String token, String expectedSubject) {
    try {
      Claims claims = parseClaims(token);
      return claims.getSubject().equals(expectedSubject)
          && claims.getExpiration().after(new Date());
    } catch (RuntimeException e) {
      return false;
    }
  }
}
