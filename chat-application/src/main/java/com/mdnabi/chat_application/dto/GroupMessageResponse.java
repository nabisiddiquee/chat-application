package com.mdnabi.chat_application.dto;

import com.mdnabi.chat_application.enums.MessageType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMessageResponse {

    private Long messageId;

    private Long groupId;
    private String groupName;

    private Long senderId;
    private String senderName;

    private String content;
    private MessageType messageType;

    private LocalDateTime createdAt;
}