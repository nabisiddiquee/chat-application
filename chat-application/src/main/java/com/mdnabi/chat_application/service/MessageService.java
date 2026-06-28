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

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

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

        // After saving the message in DB, publish it through WebSocket topics.
        // This allows sender and receiver clients to receive the message in real time.
        publishMessage(sender.getId(), receiver.getId(), response);

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

    private void publishMessage(Long senderId, Long receiverId, MessageResponse response) {

        // Temporary debug logs.
        // These logs help verify that WebSocket publishing is triggered after sending a message.
        // Remove these System.out.println lines before final production commit if you want clean code.
        System.out.println("======================================");
        System.out.println("WebSocket message publishing started");
        System.out.println("Sender topic: /topic/messages/" + senderId);
        System.out.println("Receiver topic: /topic/messages/" + receiverId);
        System.out.println("Sender chat topic: /topic/chats/" + senderId);
        System.out.println("Receiver chat topic: /topic/chats/" + receiverId);
        System.out.println("Message id: " + response.getId());
        System.out.println("Message content: " + response.getContent());
        System.out.println("======================================");

        // Publish message to sender's message topic.
        // Sender frontend can subscribe to this topic to update current chat instantly.
        messagingTemplate.convertAndSend("/topic/messages/" + senderId, response);

        // Publish message to receiver's message topic.
        // Receiver frontend can subscribe to this topic to receive new messages live.
        messagingTemplate.convertAndSend("/topic/messages/" + receiverId, response);

        // Publish chat-list update event to sender.
        // This helps refresh last message preview in sender's sidebar.
        messagingTemplate.convertAndSend("/topic/chats/" + senderId, response);

        // Publish chat-list update event to receiver.
        // This helps refresh last message preview and unread count in receiver's sidebar.
        messagingTemplate.convertAndSend("/topic/chats/" + receiverId, response);
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