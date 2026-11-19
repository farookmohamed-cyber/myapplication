package com.laboratory.controller;

import com.laboratory.model.MedicalReport;
import com.laboratory.service.ReportService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    public record GenerateReportRequest(Long testResultId) {}

    @GetMapping
    public List<MedicalReport> list() {
        return reportService.findAll();
    }

    @PostMapping
    public ResponseEntity<MedicalReport> generate(@RequestBody GenerateReportRequest req) {
        MedicalReport report = reportService.generateReport(req.testResultId());
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        MedicalReport report = reportService.findById(id);
        byte[] pdfBytes = reportService.getReportPdfBytes(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(report.getReportCode() + ".pdf")
                        .build()
        );
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
