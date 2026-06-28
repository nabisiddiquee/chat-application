package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.UserResponse;
import com.mdnabi.chat_application.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentUser(currentEmail));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(userService.getAllUsers(currentEmail));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(
            @RequestParam(required = false) String keyword,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(userService.searchUsers(keyword, currentEmail));
    }
}
