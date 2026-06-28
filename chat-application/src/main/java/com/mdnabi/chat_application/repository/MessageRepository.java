package com.mdnabi.chat_application.repository;

import com.mdnabi.chat_application.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
            SELECT m FROM Message m
            WHERE
            (
                m.sender.email = :currentEmail
                AND m.receiver.id = :receiverId
            )
            OR
            (
                m.sender.id = :receiverId
                AND m.receiver.email = :currentEmail
            )
            ORDER BY m.createdAt ASC
            """)
    List<Message> findConversation(
            @Param("currentEmail") String currentEmail,
            @Param("receiverId") Long receiverId
    );

    @Modifying
    @Query("""
            UPDATE Message m
            SET m.readStatus = true
            WHERE m.sender.id = :senderId
            AND m.receiver.email = :currentEmail
            AND m.readStatus = false
            """)
    int markMessagesAsRead(
            @Param("senderId") Long senderId,
            @Param("currentEmail") String currentEmail
    );
}