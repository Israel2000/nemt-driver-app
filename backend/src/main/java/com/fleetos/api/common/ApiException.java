package com.fleetos.api.common;

import java.util.Map;

/**
 * Typed API error: carries an HTTP status, a machine-readable error code and
 * an optional detail payload. GlobalExceptionHandler renders it as JSON.
 * Thrown by services so controllers stay thin.
 */
public class ApiException extends RuntimeException {

  private final int status;
  private final String error;
  private final Map<String, Object> detail;

  public ApiException(int status, String error, String message) {
    this(status, error, message, null);
  }

  public ApiException(int status, String error, String message, Map<String, Object> detail) {
    super(message);
    this.status = status;
    this.error = error;
    this.detail = detail;
  }

  public int getStatus() { return status; }
  public String getError() { return error; }
  public Map<String, Object> getDetail() { return detail; }

  public static ApiException notFound(String what) {
    return new ApiException(404, "not_found", what + " not found");
  }

  public static ApiException forbidden(String message) {
    return new ApiException(403, "forbidden", message);
  }

  public static ApiException badRequest(String message) {
    return new ApiException(400, "bad_request", message);
  }

  public static ApiException conflict(String message, Map<String, Object> detail) {
    return new ApiException(409, "conflict", message, detail);
  }
}
