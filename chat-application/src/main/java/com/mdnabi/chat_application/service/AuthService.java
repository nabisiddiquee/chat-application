package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.AuthResponse;
import com.mdnabi.chat_application.dto.LoginRequest;
import com.mdnabi.chat_application.dto.RegisterRequest;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.enums.Role;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .online(false)
                .build();

        User savedUser = userRepository.save(user);

        return buildResponse("Registration successful", savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return buildResponse("Login successful", user);
    }

    private AuthResponse buildResponse(String message, User user) {
        return AuthResponse.builder()
                .message(message)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
