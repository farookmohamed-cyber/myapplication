package com.laboratory.events;

import java.util.EventListener;

/**
 * OOP CONCEPT 7 (EVENT HANDLING):
 * Custom listener interface extending java.util.EventListener.
 */
@FunctionalInterface
public interface LabEventListener extends EventListener {
    void onLabEvent(LabEvent event);
}
