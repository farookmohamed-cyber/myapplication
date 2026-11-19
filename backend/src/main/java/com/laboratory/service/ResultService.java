package com.laboratory.service;

import com.laboratory.events.LabEventPublisher;
import com.laboratory.events.LabEventType;
import com.laboratory.exception.InvalidSampleException;
import com.laboratory.exception.InvalidTestResultException;
import com.laboratory.model.*;
import com.laboratory.processing.LabCollectionRegistry;
import com.laboratory.repository.LaboratoryStaffRepository;
import com.laboratory.repository.SampleRepository;
import com.laboratory.repository.TestResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResultService {

    private static final Pattern RANGE_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*[-–]\\s*(\\d+(?:\\.\\d+)?)");

    private final TestResultRepository resultRepository;
    private final SampleRepository sampleRepository;
    private final LaboratoryStaffRepository staffRepository;
    private final LabCollectionRegistry registry;
    private final LabEventPublisher eventPublisher;

    public ResultService(
            TestResultRepository resultRepository,
            SampleRepository sampleRepository,
            LaboratoryStaffRepository staffRepository,
            LabCollectionRegistry registry,
            LabEventPublisher eventPublisher) {
        this.resultRepository = resultRepository;
        this.sampleRepository = sampleRepository;
        this.staffRepository = staffRepository;
        this.registry = registry;
        this.eventPublisher = eventPublisher;
    }

    public List<TestResult> findAll() {
        return resultRepository.findAll();
    }

    public TestResult findById(Long id) {
        return resultRepository.findById(id)
                .orElseThrow(() -> new InvalidTestResultException("Test result not found with ID: " + id));
    }

    @Transactional
    public TestResult recordResult(Long sampleId, String measuredValue, String remarks, Long staffId, ResultStatus overrideStatus) {
        if (measuredValue == null || measuredValue.isBlank()) {
            throw new InvalidTestResultException("Measured test value cannot be empty.");
        }

        Sample sample = sampleRepository.findById(sampleId)
                .orElseThrow(() -> new InvalidSampleException("Sample not found with ID: " + sampleId));

        if (sample.getStatus() == SampleStatus.REGISTERED) {
            throw new InvalidSampleException("Sample " + sample.getSampleCode() + " must be collected and processed before recording results.");
        }

        LaboratoryTest test = sample.getLaboratoryTest();
        ResultStatus evaluatedStatus = overrideStatus != null
                ? overrideStatus
                : evaluateAgainstReference(measuredValue.trim(), test.getNormalRange());

        LaboratoryStaff staff = null;
        if (staffId != null) {
            staff = staffRepository.findById(staffId).orElse(null);
        } else {
            staff = staffRepository.findByActiveTrue().stream().findFirst().orElse(null);
        }

        TestResult result = resultRepository.findBySampleId(sampleId).orElse(new TestResult());
        result.setSample(sample);
        result.setMeasuredValue(measuredValue.trim());
        result.setUnit(test.getUnit());
        result.setReferenceRange(test.getNormalRange());
        result.setResultStatus(evaluatedStatus);
        result.setRemarks(remarks != null ? remarks.trim() : "");
        result.setCompletedDate(LocalDateTime.now());
        result.setVerifiedBy(staff);

        sample.setStatus(SampleStatus.COMPLETED);
        sampleRepository.save(sample);

        TestResult saved = resultRepository.save(result);
        registry.recordResult(saved);

        eventPublisher.publish(
                LabEventType.TEST_COMPLETED,
                sample.getSampleCode(),
                "Result recorded for " + test.getTestName() + " (" + evaluatedStatus + "): " + measuredValue + " " + test.getUnit()
        );
        return saved;
    }

    public ResultStatus evaluateAgainstReference(String measuredValue, String normalRange) {
        if (measuredValue == null || measuredValue.isBlank()) {
            throw new InvalidTestResultException("Measured value is required for validation.");
        }
        String normalized = measuredValue.trim().toLowerCase();
        if (normalized.contains("positive") || normalized.contains("reactive") || normalized.contains("detected")) {
            return ResultStatus.ABNORMAL;
        }
        if (normalized.contains("negative") || normalized.contains("non-reactive") || normalized.contains("clear")) {
            return ResultStatus.NORMAL;
        }

        Matcher matcher = RANGE_PATTERN.matcher(normalRange != null ? normalRange : "");
        if (matcher.find()) {
            try {
                double val = Double.parseDouble(measuredValue.replaceAll("[^0-9.-]", ""));
                if (val < 0) {
                    throw new InvalidTestResultException("Numeric laboratory measurement cannot be negative: " + measuredValue);
                }
                double low = Double.parseDouble(matcher.group(1));
                double high = Double.parseDouble(matcher.group(2));
                if (val < low * 0.7 || val > high * 1.35) {
                    return ResultStatus.CRITICAL;
                }
                if (val < low || val > high) {
                    return ResultStatus.ABNORMAL;
                }
                return ResultStatus.NORMAL;
            } catch (NumberFormatException ignored) {
                // Non-numeric text values fall through
            }
        }
        return ResultStatus.NORMAL;
    }
}
