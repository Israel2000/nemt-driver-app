package com.fleetos.api.repo;

import com.fleetos.api.domain.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
  /** Workspace is fetched eagerly: the JWT filter loads the principal
   *  outside a transaction, and the lazy proxy could not initialize later. */
  @EntityGraph(attributePaths = "workspace")
  Optional<AppUser> findByEmailIgnoreCase(String email);
  boolean existsByEmailIgnoreCase(String email);
}
