package com.mdnabi.chat_application.config;

import com.mdnabi.chat_application.service.UserStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final UserStatusService userStatusService;

    private final ConcurrentHashMap<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Set<String>> userSessionsMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        try {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

            String sessionId = headerAccessor.getSessionId();
            String userIdHeader = headerAccessor.getFirstNativeHeader("userId");

            System.out.println("WebSocket connect event received");
            System.out.println("Session ID: " + sessionId);
            System.out.println("User ID header: " + userIdHeader);

            if (sessionId == null || userIdHeader == null || userIdHeader.isBlank()) {
                return;
            }

            Long userId = Long.parseLong(userIdHeader);

            sessionUserMap.put(sessionId, userId);

            userSessionsMap
                    .computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet())
                    .add(sessionId);

            userStatusService.markUserOnline(userId);

            System.out.println("User connected: " + userId + ", session: " + sessionId);

        } catch (Exception e) {
            System.out.println("WebSocket connect event error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            String sessionId = event.getSessionId();

            Long userId = sessionUserMap.remove(sessionId);

            if (userId == null) {
                return;
            }

            Set<String> sessions = userSessionsMap.get(userId);

            if (sessions != null) {
                sessions.remove(sessionId);

                if (sessions.isEmpty()) {
                    userSessionsMap.remove(userId);
                    userStatusService.markUserOffline(userId);
                }
            }

            System.out.println("User disconnected: " + userId + ", session: " + sessionId);

        } catch (Exception e) {
            System.out.println("WebSocket disconnect event error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}