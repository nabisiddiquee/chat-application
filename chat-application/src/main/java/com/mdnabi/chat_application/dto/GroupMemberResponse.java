package com.mdnabi.chat_application.dto;

import com.mdnabi.chat_application.enums.GroupMemberRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberResponse {

    private Long userId;
    private String name;
    private String email;
    private Boolean online;
    private LocalDateTime lastSeen;

    private GroupMemberRole role;
    private LocalDateTime joinedAt;
}