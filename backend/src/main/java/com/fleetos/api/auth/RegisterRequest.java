package com.fleetos.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Matches the frontend admin signup form: company + contact + password. */
public record RegisterRequest(
    @NotBlank String companyName,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 4, max = 100) String password,
    String fullName,
    String fleetSize,
    String plan) {}
