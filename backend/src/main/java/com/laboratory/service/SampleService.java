package com.laboratory.service;

import com.laboratory.events.LabEventPublisher;
import com.laboratory.events.LabEventType;
import com.laboratory.exception.InvalidSampleException;
import com.laboratory.model.*;
import com.laboratory.processing.ConcurrentTestProcessor;
import com.laboratory.processing.LabCollectionRegistry;
import com.laboratory.processing.TestProcessingReport;
import com.laboratory.repository.SampleRepository;
import com.laboratory.utility.IdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SampleService {

    private final SampleRepository sampleRepository;
    private final PatientService patientService;
    private final TestService testService;
    private final IdGenerator idGenerator;
    private final LabCollectionRegistry registry;
    private final ConcurrentTestProcessor concurrentProcessor;
    private final LabEventPublisher eventPublisher;

    public SampleService(
            SampleRepository sampleRepository,
            PatientService patientService,
            TestService testService,
            IdGenerator idGenerator,
            LabCollectionRegistry registry,
            ConcurrentTestProcessor concurrentProcessor,
            LabEventPublisher eventPublisher) {
        this.sampleRepository = sampleRepository;
        this.patientService = patientService;
        this.testService = testService;
        this.idGenerator = idGenerator;
        this.registry = registry;
        this.concurrentProcessor = concurrentProcessor;
        this.eventPublisher = eventPublisher;
    }

    public List<Sample> findAll(SampleStatus status) {
        return (status != null) ? sampleRepository.findByStatus(status) : sampleRepository.findAll();
    }

    public Sample findById(Long id) {
        return sampleRepository.findById(id)
                .orElseThrow(() -> new InvalidSampleException("Sample not found with ID: " + id));
    }

    @Transactional
    public Sample collectSample(Long patientId, Long testId, SampleStatus initialStatus) {
        Patient patient = patientService.findById(patientId);
        LaboratoryTest test = testService.findById(testId);

        String sampleCode = idGenerator.nextSampleCode();
        if (!registry.trackUniqueSampleCode(sampleCode)) {
            sampleCode = idGenerator.nextSampleCode();
            registry.trackUniqueSampleCode(sampleCode);
        }

        Sample sample = new Sample();
        sample.setSampleCode(sampleCode);
        sample.setPatient(patient);
        sample.setLaboratoryTest(test);
        sample.setCollectionDate(LocalDateTime.now());
        sample.setStatus(initialStatus != null ? initialStatus : SampleStatus.COLLECTED);

        Sample saved = sampleRepository.save(sample);
        if (saved.getStatus() == SampleStatus.COLLECTED || saved.getStatus() == SampleStatus.REGISTERED) {
            registry.enqueuePendingSample(saved);
        }

        eventPublisher.publish(
                LabEventType.SAMPLE_COLLECTED,
                saved.getSampleCode(),
                "Sample " + saved.getSampleCode() + " collected for " + patient.getFullName() + " (" + test.getTestName() + ")"
        );
        return saved;
    }

    @Transactional
    public Sample updateStatus(Long id, SampleStatus nextStatus) {
        if (nextStatus == null) {
            throw new InvalidSampleException("Target sample status is required.");
        }
        Sample sample = findById(id);
        sample.setStatus(nextStatus);
        Sample saved = sampleRepository.save(sample);
        if (nextStatus == SampleStatus.COLLECTED) {
            eventPublisher.publish(
                    LabEventType.SAMPLE_COLLECTED,
                    saved.getSampleCode(),
                    "Sample " + saved.getSampleCode() + " marked COLLECTED"
            );
        }
        return saved;
    }

    public TestProcessingReport processSingle(Long sampleId) {
        Sample sample = findById(sampleId);
        return concurrentProcessor.processSingleSample(sample);
    }

    public List<TestProcessingReport> processBatch(List<Long> sampleIds) {
        List<Sample> samples = (sampleIds == null || sampleIds.isEmpty())
                ? sampleRepository.findByStatus(SampleStatus.COLLECTED)
                : sampleRepository.findAllById(sampleIds);
        return concurrentProcessor.processBatchConcurrently(samples);
    }
}
