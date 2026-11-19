package com.laboratory.events;

import org.springframework.stereotype.Component;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * OOP CONCEPT 7 (EVENT HANDLING):
 * Thread-safe event publisher managing custom LabEventListener subscribers.
 */
@Component
public class LabEventPublisher {

    private final List<LabEventListener> listeners = new CopyOnWriteArrayList<>();
    private final LinkedList<LabEvent> recentEvents = new LinkedList<>();
    private static final int MAX_HISTORY = 50;

    public void registerListener(LabEventListener listener) {
        if (listener != null && !listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public void removeListener(LabEventListener listener) {
        listeners.remove(listener);
    }

    public void publish(LabEventType type, String entityCode, String message) {
        LabEvent event = new LabEvent(type, entityCode, message);
        synchronized (recentEvents) {
            recentEvents.addFirst(event);
            while (recentEvents.size() > MAX_HISTORY) {
                recentEvents.removeLast();
            }
        }
        for (LabEventListener listener : listeners) {
            try {
                listener.onLabEvent(event);
            } catch (RuntimeException ignored) {
                // Isolate listener failures so primary workflow continues safely
            }
        }
    }

    public List<LabEvent> getRecentEvents() {
        synchronized (recentEvents) {
            return Collections.unmodifiableList(new LinkedList<>(recentEvents));
        }
    }
}
