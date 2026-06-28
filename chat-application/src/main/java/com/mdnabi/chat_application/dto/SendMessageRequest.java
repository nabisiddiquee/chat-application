package com.mdnabi.chat_application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "Receiver id is required")
    private Long receiverId;

    @NotBlank(message = "Message content is required")
    private String content;
}