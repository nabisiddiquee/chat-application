package com.mdnabi.chat_application.repository;

import com.mdnabi.chat_application.entity.ChatGroup;
import com.mdnabi.chat_application.entity.GroupMember;
import com.mdnabi.chat_application.enums.GroupMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    boolean existsByChatGroupIdAndUserEmail(Long groupId, String email);

    boolean existsByChatGroupIdAndUserId(Long groupId, Long userId);

    Optional<GroupMember> findByChatGroupIdAndUserEmail(Long groupId, String email);

    List<GroupMember> findByUserEmail(String email);

    List<GroupMember> findByChatGroupId(Long groupId);

    Long countByChatGroupId(Long groupId);

    List<GroupMember> findByChatGroup(ChatGroup chatGroup);

    boolean existsByChatGroupIdAndUserEmailAndRole(
            Long groupId,
            String email,
            GroupMemberRole role
    );
}