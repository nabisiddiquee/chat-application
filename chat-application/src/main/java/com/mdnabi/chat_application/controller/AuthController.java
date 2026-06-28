package com.mdnabi.chat_application.controller;


import com.mdnabi.chat_application.dto.AuthResponse;
import com.mdnabi.chat_application.dto.LoginRequest;
import com.mdnabi.chat_application.dto.RegisterRequest;
import com.mdnabi.chat_application.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/protected")
    public ResponseEntity<String> protectedApi() {
        return ResponseEntity.ok("JWT protected API is working");
    }
}
