package com.fleetos.api.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Renders ApiException as JSON; anything else becomes a 500 JSON body. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("error", ex.getError());
    body.put("message", ex.getMessage());
    if (ex.getDetail() != null) {
      body.putAll(ex.getDetail());
    }
    return ResponseEntity.status(ex.getStatus()).body(body);
  }

  /**
   * ResponseStatusException (thrown by AuthService for 401/409) must keep
   * its status — the catch-all below would otherwise flatten it to a 500.
   */
  @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handleResponseStatus(
      org.springframework.web.server.ResponseStatusException ex) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("error", ex.getStatusCode().toString());
    body.put("message", ex.getReason());
    return ResponseEntity.status(ex.getStatusCode()).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleOther(Exception ex) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("error", "internal_error");
    body.put("message", ex.getMessage());
    return ResponseEntity.status(500).body(body);
  }
}
