package com.fleetos.api.security;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.repo.AppUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Reads a Bearer JWT, loads the user, and sets the Spring Security context. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final AppUserRepository users;

  public JwtAuthFilter(JwtService jwtService, AppUserRepository users) {
    this.jwtService = jwtService;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        String email = jwtService.extractSubject(token);
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
          users.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (jwtService.isValid(token, user.getEmail())) {
              UsernamePasswordAuthenticationToken auth =
                  new UsernamePasswordAuthenticationToken(
                      user, null,
                      List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
              SecurityContextHolder.getContext().setAuthentication(auth);
            }
          });
        }
      } catch (RuntimeException ignored) {
        // Invalid/expired token: request continues unauthenticated and
        // SecurityConfig will reject protected endpoints with 401.
      }
    }
    chain.doFilter(request, response);
  }
}
