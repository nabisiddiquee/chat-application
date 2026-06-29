package com.mdnabi.chat_application.dto;

import lombok.Data;

import java.util.List;

@Data
public class AddGroupMemberRequest {

    private List<Long> userIds;
}