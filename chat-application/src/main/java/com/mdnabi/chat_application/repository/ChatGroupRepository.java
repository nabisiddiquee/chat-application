package com.mdnabi.chat_application.repository;

import com.mdnabi.chat_application.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
}