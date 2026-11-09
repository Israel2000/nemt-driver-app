package com.fleetos.api.repo;

import com.fleetos.api.domain.Credential;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CredentialRepository extends JpaRepository<Credential, UUID> {
  List<Credential> findByDriverId(UUID driverId);
}
