package com.laboratory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_code", nullable = false, unique = true, length = 32)
    private String reportCode;

    @NotNull(message = "Test result is required")
    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "test_result_id", nullable = false, unique = true)
    private TestResult testResult;

    @Column(name = "generated_date", nullable = false)
    private LocalDateTime generatedDate;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "authorized_by_name", nullable = false, length = 120)
    private String authorizedByName;

    @Column(name = "authorized_by_role", nullable = false, length = 80)
    private String authorizedByRole;

    public MedicalReport() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReportCode() { return reportCode; }
    public void setReportCode(String reportCode) { this.reportCode = reportCode; }

    public TestResult getTestResult() { return testResult; }
    public void setTestResult(TestResult testResult) { this.testResult = testResult; }

    public LocalDateTime getGeneratedDate() { return generatedDate; }
    public void setGeneratedDate(LocalDateTime generatedDate) { this.generatedDate = generatedDate; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getAuthorizedByName() { return authorizedByName; }
    public void setAuthorizedByName(String authorizedByName) { this.authorizedByName = authorizedByName; }

    public String getAuthorizedByRole() { return authorizedByRole; }
    public void setAuthorizedByRole(String authorizedByRole) { this.authorizedByRole = authorizedByRole; }
}
