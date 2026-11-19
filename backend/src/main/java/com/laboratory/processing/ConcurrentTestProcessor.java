package com.laboratory.processing;

import com.laboratory.events.LabEventPublisher;
import com.laboratory.events.LabEventType;
import com.laboratory.exception.InvalidSampleException;
import com.laboratory.model.LaboratoryTest;
import com.laboratory.model.Sample;
import com.laboratory.model.SampleStatus;
import com.laboratory.repository.SampleRepository;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

/**
 * OOP CONCEPT 2 (RUNTIME POLYMORPHISM), CONCEPT 3 (TRY-CATCH-FINALLY), & CONCEPT 4 (MULTITHREADING):
 * Uses ExecutorService to concurrently process multiple laboratory samples in parallel,
 * dispatching each test through parent LaboratoryTest references.
 */
@Component
public class ConcurrentTestProcessor {

    private final ExecutorService executorService = Executors.newFixedThreadPool(4, runnable -> {
        Thread thread = new Thread(runnable);
        thread.setName("lab-worker-" + thread.getId());
        thread.setDaemon(true);
        return thread;
    });

    private final ReentrantLock stateLock = new ReentrantLock();
    private final SampleRepository sampleRepository;
    private final LabCollectionRegistry collectionRegistry;
    private final LabEventPublisher eventPublisher;

    public ConcurrentTestProcessor(
            SampleRepository sampleRepository,
            LabCollectionRegistry collectionRegistry,
            LabEventPublisher eventPublisher) {
        this.sampleRepository = sampleRepository;
        this.collectionRegistry = collectionRegistry;
        this.eventPublisher = eventPublisher;
    }

    public TestProcessingReport processSingleSample(Sample sample) {
        if (sample == null || sample.getLaboratoryTest() == null) {
            throw new InvalidSampleException("Sample or assigned laboratory test cannot be null.");
        }
        if (sample.getStatus() == SampleStatus.REGISTERED) {
            throw new InvalidSampleException("Sample " + sample.getSampleCode() + " must be COLLECTED before processing.");
        }

        stateLock.lock();
        try {
            sample.setStatus(SampleStatus.PROCESSING);
            sampleRepository.save(sample);
        } finally {
            stateLock.unlock();
        }

        // Runtime polymorphism via parent class reference LaboratoryTest
        LaboratoryTest testReference = sample.getLaboratoryTest();
        TestProcessingReport report = testReference.processTest(sample);

        stateLock.lock();
        try {
            sample.setProcessingNotes(report.getSummaryNotes());
            sample.setProcessedAt(report.getProcessedAt());
            sampleRepository.save(sample);
        } finally {
            stateLock.unlock();
        }

        eventPublisher.publish(
                LabEventType.TEST_COMPLETED,
                sample.getSampleCode(),
                "Polymorphic " + report.getProcessorClass() + " processed " + sample.getSampleCode()
                        + " on thread " + report.getThreadName()
        );
        return report;
    }

    public List<TestProcessingReport> processBatchConcurrently(List<Sample> samples) {
        if (samples == null || samples.isEmpty()) {
            throw new InvalidSampleException("No samples queued for concurrent batch processing.");
        }

        for (Sample s : samples) {
            collectionRegistry.enqueuePendingSample(s);
        }

        List<Future<TestProcessingReport>> futures = new ArrayList<>();
        while (true) {
            Sample queuedSample = collectionRegistry.pollPendingSample();
            if (queuedSample == null) {
                break;
            }
            futures.add(executorService.submit(() -> {
                try {
                    Thread.sleep(120);
                    return processSingleSample(queuedSample);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new InvalidSampleException("Processing interrupted for sample " + queuedSample.getSampleCode());
                }
            }));
        }

        List<TestProcessingReport> completedReports = new ArrayList<>();
        try {
            for (Future<TestProcessingReport> future : futures) {
                completedReports.add(future.get(15, TimeUnit.SECONDS));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new InvalidSampleException("Concurrent batch execution was interrupted.");
        } catch (ExecutionException | TimeoutException e) {
            throw new InvalidSampleException("Concurrent test execution failed: " + e.getMessage());
        } finally {
            // Ensure lock is never left held in edge scenarios
            if (stateLock.isHeldByCurrentThread()) {
                stateLock.unlock();
            }
        }

        return completedReports;
    }

    @PreDestroy
    public void shutdownPool() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
