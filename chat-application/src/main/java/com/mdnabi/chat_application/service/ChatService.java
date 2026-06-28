package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.ChatListResponse;
import com.mdnabi.chat_application.entity.Message;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.repository.MessageRepository;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public List<ChatListResponse> getChatList(String currentEmail) {
        List<User> users = userRepository.findByEmailNot(currentEmail);

        return users.stream()
                .map(user -> buildChatListResponse(currentEmail, user))
                .sorted(chatListComparator())
                .toList();
    }

    private ChatListResponse buildChatListResponse(String currentEmail, User user) {
        Message lastMessage = messageRepository
                .findLastMessage(currentEmail, user.getId(), PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse(null);

        Long unreadCount = messageRepository.countUnreadMessages(user.getId(), currentEmail);

        return ChatListResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .online(user.getOnline())
                .lastSeen(user.getLastSeen())
                .lastMessageId(lastMessage != null ? lastMessage.getId() : null)
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageTime(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .lastMessageSentByMe(
                        lastMessage != null &&
                                lastMessage.getSender().getEmail().equals(currentEmail)
                )
                .unreadCount(unreadCount)
                .build();
    }

    private Comparator<ChatListResponse> chatListComparator() {
        return Comparator
                .comparing(
                        ChatListResponse::getLastMessageTime,
                        Comparator.nullsLast(LocalDateTime::compareTo)
                )
                .reversed();
    }
}