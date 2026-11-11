package com.fleetos.api.repo;

import com.fleetos.api.domain.Invoice;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
  List<Invoice> findByWorkspaceIdOrderByCreatedAtDesc(String workspaceId);
  List<Invoice> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(String workspaceId, String status);
}
