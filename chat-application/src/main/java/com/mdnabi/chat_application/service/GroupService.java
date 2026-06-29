package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.*;
import com.mdnabi.chat_application.entity.ChatGroup;
import com.mdnabi.chat_application.entity.GroupMember;
import com.mdnabi.chat_application.entity.GroupMessage;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.enums.GroupMemberRole;
import com.mdnabi.chat_application.enums.MessageType;
import com.mdnabi.chat_application.repository.ChatGroupRepository;
import com.mdnabi.chat_application.repository.GroupMemberRepository;
import com.mdnabi.chat_application.repository.GroupMessageRepository;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public GroupDetailsResponse createGroup(String currentEmail, CreateGroupRequest request) {
        User creator = getUserByEmail(currentEmail);

        ChatGroup group = ChatGroup.builder()
                .groupName(request.getGroupName().trim())
                .createdBy(creator)
                .build();

        ChatGroup savedGroup = chatGroupRepository.save(group);

        GroupMember creatorMember = GroupMember.builder()
                .chatGroup(savedGroup)
                .user(creator)
                .role(GroupMemberRole.ADMIN)
                .build();

        groupMemberRepository.save(creatorMember);

        Set<Long> memberIds = new LinkedHashSet<>();

        if (request.getMemberIds() != null) {
            memberIds.addAll(request.getMemberIds());
        }

        memberIds.remove(creator.getId());

        for (Long memberId : memberIds) {
            User user = userRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + memberId));

            GroupMember member = GroupMember.builder()
                    .chatGroup(savedGroup)
                    .user(user)
                    .role(GroupMemberRole.MEMBER)
                    .build();

            groupMemberRepository.save(member);
        }

        return getGroupDetails(currentEmail, savedGroup.getId());
    }

    public List<GroupResponse> getMyGroups(String currentEmail) {
        return groupMemberRepository.findByUserEmail(currentEmail)
                .stream()
                .map(GroupMember::getChatGroup)
                .map(this::mapToGroupResponse)
                .toList();
    }

    public GroupDetailsResponse getGroupDetails(String currentEmail, Long groupId) {
        validateGroupMember(groupId, currentEmail);

        ChatGroup group = getGroupById(groupId);

        List<GroupMemberResponse> members = groupMemberRepository.findByChatGroupId(groupId)
                .stream()
                .map(this::mapToGroupMemberResponse)
                .toList();

        return GroupDetailsResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .createdById(group.getCreatedBy().getId())
                .createdByName(group.getCreatedBy().getName())
                .createdAt(group.getCreatedAt())
                .members(members)
                .build();
    }

    @Transactional
    public GroupDetailsResponse addMembers(String currentEmail, Long groupId, AddGroupMemberRequest request) {
        validateGroupAdmin(groupId, currentEmail);

        ChatGroup group = getGroupById(groupId);

        if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
            return getGroupDetails(currentEmail, groupId);
        }

        Set<Long> userIds = new LinkedHashSet<>(request.getUserIds());

        for (Long userId : userIds) {
            if (groupMemberRepository.existsByChatGroupIdAndUserId(groupId, userId)) {
                continue;
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

            GroupMember member = GroupMember.builder()
                    .chatGroup(group)
                    .user(user)
                    .role(GroupMemberRole.MEMBER)
                    .build();

            groupMemberRepository.save(member);
        }

        return getGroupDetails(currentEmail, groupId);
    }

    @Transactional
    public GroupMessageResponse sendGroupMessage(
            String currentEmail,
            Long groupId,
            SendGroupMessageRequest request
    ) {
        validateGroupMember(groupId, currentEmail);

        User sender = getUserByEmail(currentEmail);
        ChatGroup group = getGroupById(groupId);

        GroupMessage message = GroupMessage.builder()
                .chatGroup(group)
                .sender(sender)
                .content(request.getContent())
                .messageType(MessageType.TEXT)
                .build();

        GroupMessage savedMessage = groupMessageRepository.save(message);
        GroupMessageResponse response = mapToGroupMessageResponse(savedMessage);

        messagingTemplate.convertAndSend("/topic/groups/" + groupId, response);

        return response;
    }

    public List<GroupMessageResponse> getGroupMessages(String currentEmail, Long groupId) {
        validateGroupMember(groupId, currentEmail);

        return groupMessageRepository.findByChatGroupIdOrderByCreatedAtAsc(groupId)
                .stream()
                .map(this::mapToGroupMessageResponse)
                .toList();
    }

    private void validateGroupMember(Long groupId, String email) {
        boolean member = groupMemberRepository.existsByChatGroupIdAndUserEmail(groupId, email);

        if (!member) {
            throw new RuntimeException("You are not a member of this group");
        }
    }

    private void validateGroupAdmin(Long groupId, String email) {
        boolean admin = groupMemberRepository.existsByChatGroupIdAndUserEmailAndRole(
                groupId,
                email,
                GroupMemberRole.ADMIN
        );

        if (!admin) {
            throw new RuntimeException("Only group admin can perform this action");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ChatGroup getGroupById(Long groupId) {
        return chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    private GroupResponse mapToGroupResponse(ChatGroup group) {
        return GroupResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .createdById(group.getCreatedBy().getId())
                .createdByName(group.getCreatedBy().getName())
                .memberCount(groupMemberRepository.countByChatGroupId(group.getId()))
                .createdAt(group.getCreatedAt())
                .build();
    }

    private GroupMemberResponse mapToGroupMemberResponse(GroupMember member) {
        User user = member.getUser();

        return GroupMemberResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .online(user.getOnline())
                .lastSeen(user.getLastSeen())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private GroupMessageResponse mapToGroupMessageResponse(GroupMessage message) {
        return GroupMessageResponse.builder()
                .messageId(message.getId())
                .groupId(message.getChatGroup().getId())
                .groupName(message.getChatGroup().getGroupName())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}