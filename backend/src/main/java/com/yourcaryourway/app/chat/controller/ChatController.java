package com.yourcaryourway.app.chat.controller;

import com.yourcaryourway.app.chat.dto.ChatHistoryRequest;
import com.yourcaryourway.app.chat.dto.ChatMessageRequest;
import com.yourcaryourway.app.chat.dto.ChatMessageResponse;
import com.yourcaryourway.app.chat.model.ChatMessage;
import com.yourcaryourway.app.chat.service.ChatMessageService;
import com.yourcaryourway.app.chat.service.ChatPresenceService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import com.yourcaryourway.app.chat.model.ConnectedUser;


@Controller
public class ChatController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatPresenceService chatPresenceService;

    public ChatController(ChatMessageService chatMessageService, SimpMessagingTemplate messagingTemplate, ChatPresenceService chatPresenceService) {
        this.chatMessageService = chatMessageService;
        this.messagingTemplate = messagingTemplate;
        this.chatPresenceService = chatPresenceService;
    }

    @MessageMapping("/chat/send")
    public void sendMessage(@Valid @Payload ChatMessageRequest request, Principal principal) {
        String username = extractUsername(principal);

        ChatMessage savedMessage = chatMessageService.logMessage(
            username,
            request.getRecipientId(),
            request.getContent()
        );

        ChatMessageResponse response = ChatMessageResponse.fromEntity(savedMessage);
        messagingTemplate.convertAndSendToUser(
            response.getSenderUsername(),
            "/queue/messages",
            response
        );

        if (!response.getSenderId().equals(response.getRecipientId())) {
            messagingTemplate.convertAndSendToUser(
                response.getRecipientUsername(),
                "/queue/messages",
                response
            );
        }
    }

    @MessageMapping("/chat/history")
    @SendToUser("/queue/history")
    public List<ChatMessageResponse> loadHistory(@Valid @Payload ChatHistoryRequest request, Principal principal) {
        String username = extractUsername(principal);

        List<ChatMessage> history = chatMessageService.getConversationHistory(
                username,
                request.getParticipantId()
        );

        return history.stream()
                .map(ChatMessageResponse::fromEntity)
                .toList();
    }

    private String extractUsername(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated user cannot participate in chat");
        }
        return principal.getName();
    }

    @MessageMapping("/chat/connected-users")
    @SendToUser("/queue/connected-users")
    public List<ConnectedUser> getConnectedUsers(Principal principal) {
        return chatPresenceService.getConnectedUsers().stream().toList();
    }
}
