package com.mdnabi.chat_application.service;

import com.mdnabi.chat_application.dto.MessageResponse;
import com.mdnabi.chat_application.dto.SendMessageRequest;
import com.mdnabi.chat_application.entity.Message;
import com.mdnabi.chat_application.entity.User;
import com.mdnabi.chat_application.enums.MessageType;
import com.mdnabi.chat_application.repository.MessageRepository;
import com.mdnabi.chat_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.upload.dir:uploads/chat-files}")
    private String uploadDir;

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

    @Transactional
    public MessageResponse sendFileMessage(String currentEmail, Long receiverId, MultipartFile file, String content) {
        User sender = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("You cannot send file to yourself");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
            String extension = "";

            int dotIndex = originalFileName.lastIndexOf(".");
            if (dotIndex >= 0) {
                extension = originalFileName.substring(dotIndex);
            }

            String storedFileName = UUID.randomUUID() + extension;
            Path targetPath = uploadPath.resolve(storedFileName).normalize();

            file.transferTo(targetPath.toFile());

            String finalContent = content != null && !content.trim().isEmpty()
                    ? content.trim()
                    : originalFileName;

            Message message = Message.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .content(finalContent)
                    .messageType(MessageType.FILE)
                    .readStatus(false)
                    .fileOriginalName(originalFileName)
                    .fileStoredName(storedFileName)
                    .fileContentType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            Message savedMessage = messageRepository.save(message);
            MessageResponse response = mapToResponse(savedMessage);

            publishRealtimeMessage(sender, receiver, response);

            return response;
        } catch (Exception exception) {
            throw new RuntimeException("File upload failed: " + exception.getMessage());
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(fileName).normalize();

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File not found");
            }

            return resource;
        } catch (MalformedURLException exception) {
            throw new RuntimeException("File not found");
        }
    }

    public String getFileContentType(String fileName) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(fileName).normalize();

            String contentType = Files.probeContentType(filePath);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (Exception exception) {
            return "application/octet-stream";
        }
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
                buildChatPayload(receiver, response, true, 0)
        );

        messagingTemplate.convertAndSend(
                "/topic/chats/" + receiver.getId(),
                buildChatPayload(sender, response, false, 1)
        );

        System.out.println("Realtime message published to /topic/messages/" + sender.getId());
        System.out.println("Realtime message published to /topic/messages/" + receiver.getId());
        System.out.println("Realtime chat published to /topic/chats/" + sender.getId());
        System.out.println("Realtime chat published to /topic/chats/" + receiver.getId());
    }

    private Map<String, Object> buildChatPayload(User user, MessageResponse response, boolean sentByMe, int unreadCount) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", user.getId());
        payload.put("name", user.getName());
        payload.put("email", user.getEmail());
        payload.put("lastMessageId", response.getId());
        payload.put("lastMessage", response.getMessageType() == MessageType.FILE
                ? "📎 " + response.getFileOriginalName()
                : response.getContent());
        payload.put("lastMessageTime", response.getCreatedAt());
        payload.put("lastMessageSentByMe", sentByMe);
        payload.put("unreadCount", unreadCount);
        return payload;
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
                .fileOriginalName(message.getFileOriginalName())
                .fileStoredName(message.getFileStoredName())
                .fileContentType(message.getFileContentType())
                .fileSize(message.getFileSize())
                .createdAt(message.getCreatedAt())
                .build();
    }
}