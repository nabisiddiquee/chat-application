package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.UserStatusResponse;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserStatusService {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void markUserOnline(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setOnline(true);
        userRepository.save(user);

        publishStatus(user);
    }

    @Transactional
    public void markUserOffline(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setOnline(false);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        publishStatus(user);
    }

    private void publishStatus(User user) {
        UserStatusResponse response = UserStatusResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .online(user.getOnline())
                .lastSeen(user.getLastSeen())
                .build();

        // Global topic for all connected clients.
        messagingTemplate.convertAndSend("/topic/status", response);

        // User-specific status topic.
        messagingTemplate.convertAndSend("/topic/status/" + user.getId(), response);
    }
}