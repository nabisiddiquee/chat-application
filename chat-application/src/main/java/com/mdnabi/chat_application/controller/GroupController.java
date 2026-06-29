package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.*;
import com.mdnabi.chat_application.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupDetailsResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(currentEmail, request));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(groupService.getMyGroups(currentEmail));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDetailsResponse> getGroupDetails(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(groupService.getGroupDetails(currentEmail, groupId));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupDetailsResponse> addMembers(
            @PathVariable Long groupId,
            @RequestBody AddGroupMemberRequest request,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(groupService.addMembers(currentEmail, groupId, request));
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<GroupMessageResponse> sendGroupMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody SendGroupMessageRequest request,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.sendGroupMessage(currentEmail, groupId, request));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<GroupMessageResponse>> getGroupMessages(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(groupService.getGroupMessages(currentEmail, groupId));
    }
}