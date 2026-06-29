package com.mdnabi.chat_application.dto;

import lombok.Data;

@Data
public class TypingRequest {

    private Long senderId;
    private Long receiverId;
    private Boolean typing;
}