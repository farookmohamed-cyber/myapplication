package com.laboratory.service;

import com.laboratory.events.LabEventPublisher;
import com.laboratory.events.LabEventType;
import com.laboratory.exception.InvalidTestResultException;
import com.laboratory.model.LaboratoryStaff;
import com.laboratory.model.MedicalReport;
import com.laboratory.model.TestResult;
import com.laboratory.repository.MedicalReportRepository;
import com.laboratory.utility.IdGenerator;
import com.laboratory.utility.PdfReportGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportService {

    private final MedicalReportRepository reportRepository;
    private final ResultService resultService;
    private final IdGenerator idGenerator;
    private final PdfReportGenerator pdfGenerator;
    private final LabEventPublisher eventPublisher;

    public ReportService(
            MedicalReportRepository reportRepository,
            ResultService resultService,
            IdGenerator idGenerator,
            PdfReportGenerator pdfGenerator,
            LabEventPublisher eventPublisher) {
        this.reportRepository = reportRepository;
        this.resultService = resultService;
        this.idGenerator = idGenerator;
        this.pdfGenerator = pdfGenerator;
        this.eventPublisher = eventPublisher;
    }

    public List<MedicalReport> findAll() {
        return reportRepository.findAll();
    }

    public MedicalReport findById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new InvalidTestResultException("Medical report not found with ID: " + id));
    }

    @Transactional
    public MedicalReport generateReport(Long testResultId) {
        TestResult result = resultService.findById(testResultId);
        MedicalReport existing = reportRepository.findByTestResultId(testResultId).orElse(null);
        if (existing != null) {
            pdfGenerator.generateAndSavePdf(existing);
            return existing;
        }

        LaboratoryStaff staff = result.getVerifiedBy();
        String authName = staff != null ? staff.getFullName() : "Dr. Elena Vance, MD";
        String authRole = staff != null ? staff.getRole() : "Chief Clinical Pathologist";

        MedicalReport report = new MedicalReport();
        report.setReportCode(idGenerator.nextReportCode());
        report.setTestResult(result);
        report.setGeneratedDate(LocalDateTime.now());
        report.setAuthorizedByName(authName);
        report.setAuthorizedByRole(authRole);

        Path pdfPath = pdfGenerator.generateAndSavePdf(report);
        report.setFilePath(pdfPath.toString());

        MedicalReport saved = reportRepository.save(report);
        eventPublisher.publish(
                LabEventType.REPORT_GENERATED,
                saved.getReportCode(),
                "Generated PDF report " + saved.getReportCode() + " for sample " + result.getSample().getSampleCode()
        );
        return saved;
    }

    public byte[] getReportPdfBytes(Long reportId) {
        MedicalReport report = findById(reportId);
        return pdfGenerator.readPdfBytes(report.getFilePath());
    }
}
