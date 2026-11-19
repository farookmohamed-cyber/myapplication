package com.laboratory.events;

import java.time.LocalDateTime;
import java.util.UUID;

public class LabEvent {
    private final String eventId;
    private final LabEventType type;
    private final String entityCode;
    private final String message;
    private final LocalDateTime timestamp;

    public LabEvent(LabEventType type, String entityCode, String message) {
        this.eventId = "EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.type = type;
        this.entityCode = entityCode;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public String getEventId() { return eventId; }
    public LabEventType getType() { return type; }
    public String getEntityCode() { return entityCode; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
