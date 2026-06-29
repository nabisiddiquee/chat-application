package com.mdnabi.chat_application.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDetailsResponse {

    private Long groupId;
    private String groupName;

    private Long createdById;
    private String createdByName;

    private LocalDateTime createdAt;

    private List<GroupMemberResponse> members;
}