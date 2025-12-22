package com.yourcaryourway.app.chat.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

import com.yourcaryourway.app.auth.repository.UserRepository;
import com.yourcaryourway.app.chat.model.ConnectedUser;
import java.util.Map;
import java.util.Collection;

@Service
public class ChatPresenceService {

    private final Map<String, ConnectedUser> connectedUsers = new ConcurrentHashMap<>();
    private final UserRepository userRepository;

    public ChatPresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void userConnected(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            connectedUsers.put(
                username,
                new ConnectedUser(user.getId(), user.getUsername())
            );
        });
    }

    public void userDisconnected(String username) {
        connectedUsers.remove(username);
    }

    public Collection<ConnectedUser> getConnectedUsers() {
        return connectedUsers.values();
    }
}