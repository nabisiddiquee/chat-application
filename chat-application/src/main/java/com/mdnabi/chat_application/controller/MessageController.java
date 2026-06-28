package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.MessageResponse;
import com.mdnabi.chat_application.dto.SendMessageRequest;
import com.mdnabi.chat_application.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendMessage(currentEmail, request));
    }

    @GetMapping("/{receiverId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long receiverId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(messageService.getConversation(currentEmail, receiverId));
    }

    @PutMapping("/read/{senderId}")
    public ResponseEntity<String> markMessagesAsRead(
            @PathVariable Long senderId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(messageService.markMessagesAsRead(currentEmail, senderId));
    }
}