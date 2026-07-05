package com.mdnabi.chat_application.controller;

import com.mdnabi.chat_application.dto.MessageResponse;
import com.mdnabi.chat_application.dto.SendMessageRequest;
import com.mdnabi.chat_application.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendMessage(currentEmail, request));
    }

    @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendFileMessage(
            @RequestParam Long receiverId,
            @RequestParam MultipartFile file,
            @RequestParam(required = false) String content,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendFileMessage(currentEmail, receiverId, file, content));
    }

    @GetMapping("/{receiverId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long receiverId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(messageService.getConversation(currentEmail, receiverId));
    }

    @GetMapping("/files/view/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {
        Resource resource = messageService.loadFileAsResource(fileName);
        String contentType = messageService.getFileContentType(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(resource.getFilename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(resource);
    }

    @GetMapping("/files/download/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Resource resource = messageService.loadFileAsResource(fileName);
        String contentType = messageService.getFileContentType(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(resource.getFilename(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(resource);
    }

    @PutMapping("/read/{senderId}")
    public ResponseEntity<String> markMessagesAsRead(
            @PathVariable Long senderId,
            Authentication authentication
    ) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(messageService.markMessagesAsRead(currentEmail, senderId));
    }
}