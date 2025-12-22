package com.yourcaryourway.app.chat.listener;

import com.yourcaryourway.app.chat.service.ChatPresenceService;
import java.security.Principal;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class ChatWebSocketListener {

    private final ChatPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketListener(ChatPresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            presenceService.userConnected(principal.getName());
            broadcastPresence();
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            presenceService.userDisconnected(principal.getName());
            broadcastPresence();
        }
    }

    private void broadcastPresence() {
        messagingTemplate.convertAndSend(
            "/topic/presence",
            presenceService.getConnectedUsers()
        );
    }
}