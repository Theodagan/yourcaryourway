package com.yourcaryourway.app.chat.dto;

import jakarta.validation.constraints.NotNull;

public class ChatHistoryRequest {

    @NotNull
    private Long participantId;

    public Long getParticipantId() {
        return participantId;
    }

    public void setParticipantId(Long participantId) {
        this.participantId = participantId;
    }
}
