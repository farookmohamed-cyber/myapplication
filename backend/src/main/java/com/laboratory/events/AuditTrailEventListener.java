package com.laboratory.events;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuditTrailEventListener implements LabEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditTrailEventListener.class);
    private final LabEventPublisher publisher;

    public AuditTrailEventListener(LabEventPublisher publisher) {
        this.publisher = publisher;
    }

    @PostConstruct
    public void subscribe() {
        publisher.registerListener(this);
    }

    @Override
    public void onLabEvent(LabEvent event) {
        log.info("[LAB EVENT {}] {} ({}) -> {}",
                event.getEventId(),
                event.getType(),
                event.getEntityCode(),
                event.getMessage());
    }
}
