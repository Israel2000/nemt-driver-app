package com.fleetos.api.auth;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Role;
import com.fleetos.api.domain.Workspace;
import com.fleetos.api.repo.AppUserRepository;
import com.fleetos.api.repo.WorkspaceRepository;
import com.fleetos.api.security.JwtService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final AppUserRepository users;
  private final WorkspaceRepository workspaces;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(AppUserRepository users, WorkspaceRepository workspaces,
      PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.users = users;
    this.workspaces = workspaces;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional(readOnly = true)
  public AuthResponse login(String email, String password) {
    AppUser user = users.findByEmailIgnoreCase(email.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    return tokenFor(user);
  }

  /**
   * Admin signup: creates a new workspace plus its first ADMIN user, and signs them in.
   * Mirrors the frontend's registerAccount() (new workspace id ws-xxxxxx, provider id
   * NEMT-PENDING-xxxx) — now persisted instead of localStorage.
   */
  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase();
    if (users.existsByEmailIgnoreCase(email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
    }
    String workspaceId = "ws-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6);
    Workspace workspace = new Workspace(
        workspaceId,
        request.companyName().trim(),
        "NEMT-PENDING-" + (1000 + (int) (Math.random() * 9000)),
        request.fleetSize() == null || request.fleetSize().isBlank() ? "1-5 vehicles" : request.fleetSize(),
        request.plan() == null || request.plan().isBlank() ? "growth" : request.plan());
    // NB: assigned String id -> save() merges; use the managed copy below.
    workspace = workspaces.save(workspace);

    String fullName = request.fullName() == null || request.fullName().isBlank()
        ? email.split("@")[0].replace('.', ' ').toUpperCase() + " (Admin)"
        : request.fullName().trim();
    AppUser user = new AppUser(
        email,
        passwordEncoder.encode(request.password()),
        fullName,
        Role.ADMIN,
        workspace);
    users.save(user);
    return tokenFor(user);
  }

  @Transactional(readOnly = true)
  public AuthResponse me(AppUser user) {
    // The principal was loaded in the JWT filter outside a transaction, so
    // re-load it here — otherwise the lazy workspace proxy can't initialize.
    AppUser fresh = users.findById(user.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    return tokenFor(fresh);
  }

  private AuthResponse tokenFor(AppUser user) {
    String token = jwtService.generateToken(
        user.getEmail(), user.getWorkspace().getId(), user.getRole().name());
    return AuthResponse.of(token, user);
  }
}
