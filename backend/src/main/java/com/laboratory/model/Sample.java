package com.laboratory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "samples")
public class Sample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sample_code", nullable = false, unique = true, length = 32)
    private String sampleCode;

    @NotNull(message = "Patient is required")
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @NotNull(message = "Laboratory test is required")
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "laboratory_test_id", nullable = false)
    private LaboratoryTest laboratoryTest;

    @Column(name = "collection_date", nullable = false)
    private LocalDateTime collectionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private SampleStatus status = SampleStatus.REGISTERED;

    @Column(name = "processing_notes", columnDefinition = "TEXT")
    private String processingNotes;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public Sample() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSampleCode() { return sampleCode; }
    public void setSampleCode(String sampleCode) { this.sampleCode = sampleCode; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public LaboratoryTest getLaboratoryTest() { return laboratoryTest; }
    public void setLaboratoryTest(LaboratoryTest laboratoryTest) { this.laboratoryTest = laboratoryTest; }

    public LocalDateTime getCollectionDate() { return collectionDate; }
    public void setCollectionDate(LocalDateTime collectionDate) { this.collectionDate = collectionDate; }

    public SampleStatus getStatus() { return status; }
    public void setStatus(SampleStatus status) { this.status = status; }

    public String getProcessingNotes() { return processingNotes; }
    public void setProcessingNotes(String processingNotes) { this.processingNotes = processingNotes; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}
