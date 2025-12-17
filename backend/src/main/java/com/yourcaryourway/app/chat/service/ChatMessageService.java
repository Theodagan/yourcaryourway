package com.yourcaryourway.app.chat.service;

import com.yourcaryourway.app.auth.model.User;
import com.yourcaryourway.app.auth.repository.UserRepository;
import com.yourcaryourway.app.chat.model.ChatMessage;
import com.yourcaryourway.app.chat.repository.ChatMessageRepository;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatMessageService {

    private static final Logger log = LoggerFactory.getLogger(ChatMessageService.class);

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatMessageService(ChatMessageRepository chatMessageRepository,
                              UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatMessage logMessage(String senderUsername, Long recipientId, String content) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Unknown sender: " + senderUsername));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown recipient id: " + recipientId));

        String conversationId = generateConversationId(sender.getId(), recipient.getId());

        ChatMessage message = new ChatMessage();
        message.setSenderId(sender.getId());
        message.setRecipientId(recipient.getId());
        message.setSenderUsername(sender.getUsername());
        message.setRecipientUsername(recipient.getUsername());
        message.setConversationId(conversationId);
        message.setContent(content);
        message.setSentAt(Instant.now());

        ChatMessage saved = chatMessageRepository.save(message);
        log.info("Chat message [{} -> {}] persisted with id {}", sender.getId(), recipient.getId(), saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getConversationHistory(String requesterUsername, Long participantId) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new IllegalArgumentException("Unknown requester: " + requesterUsername));
        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown participant id: " + participantId));

        String conversationId = generateConversationId(requester.getId(), participant.getId());

        return chatMessageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    public String generateConversationId(Long firstUserId, Long secondUserId) {
        if (firstUserId == null || secondUserId == null) {
            throw new IllegalArgumentException("Conversation participants must be provided");
        }
        return (firstUserId < secondUserId)
                ? firstUserId + "_" + secondUserId
                : secondUserId + "_" + firstUserId;
    }
}
