package com.laboratory.processing;

import com.laboratory.model.*;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * OOP CONCEPT 6 (COLLECTIONS FRAMEWORK):
 * Demonstrates ArrayList, HashMap, HashSet, Queue, and Collections utility operations
 * in a thread-safe registry synchronized with Java Collections wrappers and locks.
 */
@Component
public class LabCollectionRegistry {

    private final List<Patient> patientList = Collections.synchronizedList(new ArrayList<>());
    private final Map<TestCategory, List<LaboratoryTest>> categoryTestsMap = new HashMap<>();
    private final Set<String> uniqueSampleIds = Collections.synchronizedSet(new HashSet<>());
    private final Queue<Sample> pendingTestQueue = new ConcurrentLinkedQueue<>();
    private final List<TestResult> managedResults = Collections.synchronizedList(new ArrayList<>());

    public synchronized void syncPatients(List<Patient> patients) {
        patientList.clear();
        patientList.addAll(patients);
    }

    public synchronized void registerPatient(Patient patient) {
        patientList.removeIf(p -> Objects.equals(p.getId(), patient.getId()));
        patientList.add(patient);
    }

    public List<Patient> getPatientSnapshot() {
        synchronized (patientList) {
            return Collections.unmodifiableList(new ArrayList<>(patientList));
        }
    }

    public synchronized void indexTestCategories(List<LaboratoryTest> tests) {
        categoryTestsMap.clear();
        for (TestCategory category : TestCategory.values()) {
            categoryTestsMap.put(category, new ArrayList<>());
        }
        for (LaboratoryTest test : tests) {
            categoryTestsMap
                    .computeIfAbsent(test.getCategory(), k -> new ArrayList<>())
                    .add(test);
        }
    }

    public synchronized Map<TestCategory, Integer> getCategoryCounts() {
        Map<TestCategory, Integer> counts = new EnumMap<>(TestCategory.class);
        for (Map.Entry<TestCategory, List<LaboratoryTest>> entry : categoryTestsMap.entrySet()) {
            counts.put(entry.getKey(), entry.getValue().size());
        }
        return Collections.unmodifiableMap(counts);
    }

    public boolean trackUniqueSampleCode(String sampleCode) {
        return uniqueSampleIds.add(sampleCode);
    }

    public boolean hasSampleCode(String sampleCode) {
        return uniqueSampleIds.contains(sampleCode);
    }

    public void enqueuePendingSample(Sample sample) {
        if (sample != null) {
            pendingTestQueue.offer(sample);
        }
    }

    public Sample pollPendingSample() {
        return pendingTestQueue.poll();
    }

    public int getPendingQueueSize() {
        return pendingTestQueue.size();
    }

    public synchronized void recordResult(TestResult result) {
        managedResults.removeIf(r -> Objects.equals(r.getId(), result.getId()));
        managedResults.add(result);
        managedResults.sort(Comparator.comparing(TestResult::getCompletedDate, Comparator.nullsLast(Comparator.reverseOrder())));
    }

    public List<TestResult> getResultsSnapshot() {
        synchronized (managedResults) {
            return Collections.unmodifiableList(new ArrayList<>(managedResults));
        }
    }
}
