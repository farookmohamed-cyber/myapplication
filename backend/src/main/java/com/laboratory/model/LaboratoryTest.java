package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OOP CONCEPT 1 (INHERITANCE) & OOP CONCEPT 2 (POLYMORPHISM):
 * Abstract parent class representing a diagnostic laboratory test.
 * All 5 test subclasses extend LaboratoryTest and override processTest(Sample).
 */
@Entity
@Table(name = "laboratory_tests")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "test_category", discriminatorType = DiscriminatorType.STRING)
public abstract class LaboratoryTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_code", nullable = false, unique = true, length = 32)
    private String testCode;

    @Column(name = "test_category", insertable = false, updatable = false, length = 32)
    @Enumerated(EnumType.STRING)
    private TestCategory category;

    @NotBlank(message = "Test name is required")
    @Column(name = "test_name", nullable = false, length = 150)
    private String testName;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotBlank(message = "Sample type is required")
    @Column(name = "sample_type", nullable = false, length = 80)
    private String sampleType;

    @NotBlank(message = "Normal range is required")
    @Column(name = "normal_range", nullable = false, length = 120)
    private String normalRange;

    @NotBlank(message = "Unit is required")
    @Column(nullable = false, length = 40)
    private String unit;

    @NotBlank(message = "Processing procedure is required")
    @Column(name = "processing_procedure", nullable = false, columnDefinition = "TEXT")
    private String processingProcedure;

    @Column(name = "estimated_minutes", nullable = false)
    private Integer estimatedMinutes = 30;

    @Column(nullable = false)
    private Boolean active = true;

    protected LaboratoryTest() {}

    /**
     * Polymorphic processing method overridden by each concrete LaboratoryTest subclass.
     */
    public abstract TestProcessingReport processTest(Sample sample);

    protected TestProcessingReport buildReport(
            Sample sample,
            TestCategory category,
            List<String> steps,
            String summaryNotes) {
        return new TestProcessingReport(
                sample.getSampleCode(),
                this.testName,
                category,
                this.getClass().getSimpleName(),
                Thread.currentThread().getName(),
                steps,
                summaryNotes,
                LocalDateTime.now()
        );
    }

    public abstract TestCategory resolveCategory();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTestCode() { return testCode; }
    public void setTestCode(String testCode) { this.testCode = testCode; }

    public TestCategory getCategory() {
        return category != null ? category : resolveCategory();
    }
    public void setCategory(TestCategory category) { this.category = category; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getSampleType() { return sampleType; }
    public void setSampleType(String sampleType) { this.sampleType = sampleType; }

    public String getNormalRange() { return normalRange; }
    public void setNormalRange(String normalRange) { this.normalRange = normalRange; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getProcessingProcedure() { return processingProcedure; }
    public void setProcessingProcedure(String processingProcedure) { this.processingProcedure = processingProcedure; }

    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
