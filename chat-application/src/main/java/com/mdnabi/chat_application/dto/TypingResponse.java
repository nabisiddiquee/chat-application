package com.mdnabi.chat_application.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingResponse {

    private Long senderId;
    private String senderName;
    private String senderEmail;

    private Long receiverId;
    private Boolean typing;

    private LocalDateTime timestamp;
}