package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.ChatListResponse;
import com.mdnabi.chat_application.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatListResponse>> getChatList(Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(chatService.getChatList(currentEmail));
    }
}