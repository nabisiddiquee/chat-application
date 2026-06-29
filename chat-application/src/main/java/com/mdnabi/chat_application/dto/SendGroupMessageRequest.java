package com.mdnabi.chat_application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendGroupMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;
}