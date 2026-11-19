package com.laboratory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_results")
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Sample is required")
    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sample_id", nullable = false, unique = true)
    private Sample sample;

    @NotBlank(message = "Measured value is required")
    @Column(name = "measured_value", nullable = false, length = 80)
    private String measuredValue;

    @NotBlank(message = "Unit is required")
    @Column(nullable = false, length = 40)
    private String unit;

    @NotBlank(message = "Reference range is required")
    @Column(name = "reference_range", nullable = false, length = 120)
    private String referenceRange;

    @NotNull(message = "Result status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, length = 24)
    private ResultStatus resultStatus;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "completed_date", nullable = false)
    private LocalDateTime completedDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "verified_by_staff_id")
    private LaboratoryStaff verifiedBy;

    public TestResult() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Sample getSample() { return sample; }
    public void setSample(Sample sample) { this.sample = sample; }

    public String getMeasuredValue() { return measuredValue; }
    public void setMeasuredValue(String measuredValue) { this.measuredValue = measuredValue; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getReferenceRange() { return referenceRange; }
    public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }

    public ResultStatus getResultStatus() { return resultStatus; }
    public void setResultStatus(ResultStatus resultStatus) { this.resultStatus = resultStatus; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }

    public LaboratoryStaff getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(LaboratoryStaff verifiedBy) { this.verifiedBy = verifiedBy; }
}
