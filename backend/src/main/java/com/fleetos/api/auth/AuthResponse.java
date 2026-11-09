package com.fleetos.api.auth;

import com.fleetos.api.domain.AppUser;
import com.fleetos.api.domain.Workspace;

/** Shapes the auth responses to match the frontend's User / CompanyWorkspace model. */
public record AuthResponse(String token, UserDto user, WorkspaceDto workspace) {

  public record UserDto(String id, String email, String fullName, String role, String workspaceId) {
    static UserDto from(AppUser user) {
      return new UserDto(
          user.getId().toString(),
          user.getEmail(),
          user.getFullName(),
          user.getRole().name().toLowerCase(),
          user.getWorkspace().getId());
    }
  }

  public record WorkspaceDto(
      String id, String name, String providerId, String fleetSize, String plan, String billingCycle) {
    static WorkspaceDto from(Workspace workspace) {
      return new WorkspaceDto(
          workspace.getId(),
          workspace.getName(),
          workspace.getProviderId(),
          workspace.getFleetSize(),
          workspace.getPlan(),
          workspace.getBillingCycle());
    }
  }

  static AuthResponse of(String token, AppUser user) {
    return new AuthResponse(token, UserDto.from(user), WorkspaceDto.from(user.getWorkspace()));
  }
}
