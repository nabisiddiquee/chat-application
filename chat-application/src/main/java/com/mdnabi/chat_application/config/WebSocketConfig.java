package com.mdnabi.chat_application.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend.local-url:http://localhost:4200}")
    private String localFrontendUrl;

    @Value("${app.frontend.production-url:http://localhost:4200}")
    private String productionFrontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] allowedOrigins = buildAllowedOrigins();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins);

        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
    }

    private String[] buildAllowedOrigins() {
        List<String> origins = new ArrayList<>();
        origins.add(localFrontendUrl);
        origins.add("http://127.0.0.1:4200");

        if (productionFrontendUrl != null && !productionFrontendUrl.isBlank()) {
            origins.add(productionFrontendUrl);
        }

        return origins.toArray(new String[0]);
    }
}