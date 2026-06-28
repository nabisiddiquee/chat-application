package com.mdnabi.chat_application.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatusResponse {

    private Long userId;
    private String name;
    private String email;
    private Boolean online;
    private LocalDateTime lastSeen;
}