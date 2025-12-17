package com.yourcaryourway.app.chat.dto;

import com.yourcaryourway.app.chat.model.ChatMessage;
import java.time.Instant;

public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private Long recipientId;
    private String senderUsername;
    private String recipientUsername;
    private String conversationId;
    private String content;
    private Instant sentAt;

    public ChatMessageResponse() {}

    public ChatMessageResponse(
        Long id, 
        Long senderId, 
        Long recipientId, 
        String senderUsername,
        String recipientUsername, 
        String conversationId,
        String content,
        Instant sentAt
    ) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.senderUsername = senderUsername;
        this.recipientUsername = recipientUsername;
        this.conversationId = conversationId;
        this.content = content;
        this.sentAt = sentAt;
    }

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSenderId(),
                message.getRecipientId(),
                message.getSenderUsername(),
                message.getRecipientUsername(),
                message.getConversationId(),
                message.getContent(),
                message.getSentAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public void setSenderUsername(String senderUsername) {
        this.senderUsername = senderUsername;
    }

    public String getRecipientUsername() {
        return recipientUsername;
    }

    public void setRecipientUsername(String recipientUsername) {
        this.recipientUsername = recipientUsername;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
