package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.TypingRequest;
import com.mdnabi.chat_application.dto.TypingResponse;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class TypingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingRequest request) {
        if (request.getSenderId() == null || request.getReceiverId() == null) {
            return;
        }

        if (request.getSenderId().equals(request.getReceiverId())) {
            return;
        }

        User sender = userRepository.findById(request.getSenderId())
                .orElse(null);

        User receiver = userRepository.findById(request.getReceiverId())
                .orElse(null);

        if (sender == null || receiver == null) {
            return;
        }

        TypingResponse response = TypingResponse.builder()
                .senderId(sender.getId())
                .senderName(sender.getName())
                .senderEmail(sender.getEmail())
                .receiverId(receiver.getId())
                .typing(Boolean.TRUE.equals(request.getTyping()))
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/typing/" + receiver.getId(), response);
    }
}