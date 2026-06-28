package com.mdnabi.chat_application.dto;


import com.mdnabi.chat_application.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String message;
    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
}
