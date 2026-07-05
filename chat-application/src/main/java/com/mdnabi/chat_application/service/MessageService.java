package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.MessageResponse;
import com.mdnabi.chat_application.dto.SendMessageRequest;
import com.mdnabi.chat_application.entity.Message;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.enums.MessageType;
import com.mdnabi.chat_application.repository.MessageRepository;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse sendMessage(String currentEmail, SendMessageRequest request) {
        User sender = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("You cannot send message to yourself");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .messageType(MessageType.TEXT)
                .readStatus(false)
                .build();

        Message savedMessage = messageRepository.save(message);
        MessageResponse response = mapToResponse(savedMessage);

        publishRealtimeMessage(sender, receiver, response);

        return response;
    }

    public List<MessageResponse> getConversation(String currentEmail, Long receiverId) {
        userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        return messageRepository.findConversation(currentEmail, receiverId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public String markMessagesAsRead(String currentEmail, Long senderId) {
        int updatedCount = messageRepository.markMessagesAsRead(senderId, currentEmail);
        return updatedCount + " messages marked as read";
    }

    private void publishRealtimeMessage(User sender, User receiver, MessageResponse response) {
        messagingTemplate.convertAndSend(
                "/topic/messages/" + sender.getId(),
                response
        );

        messagingTemplate.convertAndSend(
                "/topic/messages/" + receiver.getId(),
                response
        );

        messagingTemplate.convertAndSend(
                "/topic/chats/" + sender.getId(),
                Map.of(
                        "userId", receiver.getId(),
                        "name", receiver.getName(),
                        "email", receiver.getEmail(),
                        "lastMessageId", response.getId(),
                        "lastMessage", response.getContent(),
                        "lastMessageTime", response.getCreatedAt(),
                        "lastMessageSentByMe", true,
                        "unreadCount", 0
                )
        );

        messagingTemplate.convertAndSend(
                "/topic/chats/" + receiver.getId(),
                Map.of(
                        "userId", sender.getId(),
                        "name", sender.getName(),
                        "email", sender.getEmail(),
                        "lastMessageId", response.getId(),
                        "lastMessage", response.getContent(),
                        "lastMessageTime", response.getCreatedAt(),
                        "lastMessageSentByMe", false,
                        "unreadCount", 1
                )
        );

        System.out.println("Realtime message published to /topic/messages/" + sender.getId());
        System.out.println("Realtime message published to /topic/messages/" + receiver.getId());
        System.out.println("Realtime chat published to /topic/chats/" + sender.getId());
        System.out.println("Realtime chat published to /topic/chats/" + receiver.getId());
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getName())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .readStatus(message.getReadStatus())
                .createdAt(message.getCreatedAt())
                .build();
    }
}