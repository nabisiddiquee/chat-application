package com.mdnabi.chat_application.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatListResponse {

    private Long userId;
    private String name;
    private String email;
    private Boolean online;
    private LocalDateTime lastSeen;

    private Long lastMessageId;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Boolean lastMessageSentByMe;

    private Long unreadCount;
}