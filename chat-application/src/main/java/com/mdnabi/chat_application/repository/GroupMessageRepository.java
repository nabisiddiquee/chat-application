package com.mdnabi.chat_application.repository;

import com.mdnabi.chat_application.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {

    List<GroupMessage> findByChatGroupIdOrderByCreatedAtAsc(Long groupId);
}