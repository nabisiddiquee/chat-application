package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.UserResponse;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    public List<UserResponse> getAllUsers(String currentEmail) {
        return userRepository.findByEmailNot(currentEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<UserResponse> searchUsers(String keyword, String currentEmail) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllUsers(currentEmail);
        }

        return userRepository.searchUsers(keyword.trim(), currentEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .online(user.getOnline())
                .lastSeen(user.getLastSeen())
                .build();
    }
}