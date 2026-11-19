package com.laboratory.service;

import com.laboratory.events.LabEvent;
import com.laboratory.events.LabEventPublisher;
import com.laboratory.model.SampleStatus;
import com.laboratory.model.TestCategory;
import com.laboratory.processing.LabCollectionRegistry;
import com.laboratory.repository.*;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final PatientRepository patientRepository;
    private final LaboratoryTestRepository testRepository;
    private final SampleRepository sampleRepository;
    private final TestResultRepository resultRepository;
    private final MedicalReportRepository reportRepository;
    private final LabCollectionRegistry registry;
    private final LabEventPublisher eventPublisher;

    public DashboardService(
            PatientRepository patientRepository,
            LaboratoryTestRepository testRepository,
            SampleRepository sampleRepository,
            TestResultRepository resultRepository,
            MedicalReportRepository reportRepository,
            LabCollectionRegistry registry,
            LabEventPublisher eventPublisher) {
        this.patientRepository = patientRepository;
        this.testRepository = testRepository;
        this.sampleRepository = sampleRepository;
        this.resultRepository = resultRepository;
        this.reportRepository = reportRepository;
        this.registry = registry;
        this.eventPublisher = eventPublisher;
    }

    public Map<String, Object> getSummary() {
        registry.indexTestCategories(testRepository.findAll());
        Map<TestCategory, Integer> categoryStats = registry.getCategoryCounts();
        List<LabEvent> recentEvents = eventPublisher.getRecentEvents();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalPatients", patientRepository.count());
        summary.put("totalTests", testRepository.count());
        summary.put("pendingSamples", sampleRepository.countByStatusNot(SampleStatus.COMPLETED));
        summary.put("completedTests", sampleRepository.countByStatus(SampleStatus.COMPLETED));
        summary.put("totalResults", resultRepository.count());
        summary.put("totalReports", reportRepository.count());
        summary.put("pendingQueueSize", registry.getPendingQueueSize());
        summary.put("categoryStatistics", categoryStats);
        summary.put("recentActivities", recentEvents);
        return summary;
    }
}
