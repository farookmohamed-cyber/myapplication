package com.laboratory.processing;

import com.laboratory.model.TestCategory;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Value object returned by polymorphic LaboratoryTest.processTest(Sample) calls.
 */
public class TestProcessingReport {
    private final String sampleCode;
    private final String testName;
    private final TestCategory category;
    private final String processorClass;
    private final String threadName;
    private final List<String> protocolSteps;
    private final String summaryNotes;
    private final LocalDateTime processedAt;

    public TestProcessingReport(
            String sampleCode,
            String testName,
            TestCategory category,
            String processorClass,
            String threadName,
            List<String> protocolSteps,
            String summaryNotes,
            LocalDateTime processedAt) {
        this.sampleCode = sampleCode;
        this.testName = testName;
        this.category = category;
        this.processorClass = processorClass;
        this.threadName = threadName;
        this.protocolSteps = protocolSteps;
        this.summaryNotes = summaryNotes;
        this.processedAt = processedAt;
    }

    public String getSampleCode() { return sampleCode; }
    public String getTestName() { return testName; }
    public TestCategory getCategory() { return category; }
    public String getProcessorClass() { return processorClass; }
    public String getThreadName() { return threadName; }
    public List<String> getProtocolSteps() { return protocolSteps; }
    public String getSummaryNotes() { return summaryNotes; }
    public LocalDateTime getProcessedAt() { return processedAt; }
}
