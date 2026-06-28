package com.mdnabi.chat_application.dto;

import com.mdnabi.chat_application.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private Boolean online;
    private LocalDateTime lastSeen;
}