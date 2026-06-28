package com.mdnabi.chat_application.dto;

import com.mdnabi.chat_application.enums.MessageType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Long id;

    private Long senderId;
    private String senderName;

    private Long receiverId;
    private String receiverName;

    private String content;
    private MessageType messageType;
    private Boolean readStatus;

    private LocalDateTime createdAt;
}