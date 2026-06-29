package com.mdnabi.chat_application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupRequest {

    @NotBlank(message = "Group name is required")
    private String groupName;

    private List<Long> memberIds;
}