package com.mdnabi.chat_application.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupResponse {

    private Long groupId;
    private String groupName;

    private Long createdById;
    private String createdByName;

    private Long memberCount;

    private LocalDateTime createdAt;
}