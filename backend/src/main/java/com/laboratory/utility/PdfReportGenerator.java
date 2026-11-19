package com.laboratory.utility;

import com.laboratory.model.*;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

/**
 * OOP CONCEPT 5 (FILE HANDLING) & CONCEPT 3 (TRY-CATCH-FINALLY):
 * Saves laboratory PDF reports and metadata files safely to disk, reads stored reports,
 * and returns downloadable PDF bytes.
 */
@Component
public class PdfReportGenerator {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Value("${lab.name:Vesper.ai Clinical Diagnostics Laboratory}")
    private String labName;

    @Value("${lab.address:420 BioMed Parkway, Suite 300, Clinical Research District}")
    private String labAddress;

    @Value("${lab.phone:+1 (800) 555-0194}")
    private String labPhone;

    @Value("${lab.accreditation:ISO 15189:2022 Accredited Facility}")
    private String labAccreditation;

    @Value("${lab.reports.dir:./reports}")
    private String reportsDirectory;

    public Path generateAndSavePdf(MedicalReport report) {
        TestResult result = report.getTestResult();
        Sample sample = result.getSample();
        Patient patient = sample.getPatient();
        LaboratoryTest test = sample.getLaboratoryTest();

        Path dirPath = Paths.get(reportsDirectory).toAbsolutePath().normalize();
        FileOutputStream fos = null;
        Document document = null;

        try {
            Files.createDirectories(dirPath);
            String safeFileName = report.getReportCode().replaceAll("[^A-Za-z0-9_-]", "_") + ".pdf";
            Path pdfPath = dirPath.resolve(safeFileName);
            Path metaPath = dirPath.resolve(safeFileName.replace(".pdf", ".meta.txt"));

            fos = new FileOutputStream(pdfPath.toFile());
            document = new Document(PageSize.A4, 38, 38, 42, 42);
            PdfWriter.getInstance(document, fos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, new Color(80, 80, 80));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, new Color(55, 55, 55));
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, Color.BLACK);

            Paragraph header = new Paragraph(labName, titleFont);
            header.setSpacingAfter(2);
            document.add(header);

            Paragraph contact = new Paragraph(labAddress + "  |  " + labPhone + "  |  " + labAccreditation, subFont);
            contact.setSpacingAfter(14);
            document.add(contact);

            Paragraph reportTitle = new Paragraph("DIAGNOSTIC LABORATORY MEDICAL REPORT", sectionFont);
            reportTitle.setSpacingAfter(10);
            document.add(reportTitle);

            PdfPTable infoTable = new PdfPTable(4);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(14);
            addCell(infoTable, "Report ID", labelFont);
            addCell(infoTable, report.getReportCode(), valueFont);
            addCell(infoTable, "Generated Date", labelFont);
            addCell(infoTable, report.getGeneratedDate().format(DATE_TIME_FMT), valueFont);

            addCell(infoTable, "Patient ID", labelFont);
            addCell(infoTable, patient.getPatientCode(), valueFont);
            addCell(infoTable, "Patient Name", labelFont);
            addCell(infoTable, patient.getFullName(), valueFont);

            addCell(infoTable, "Age / Gender", labelFont);
            addCell(infoTable, patient.getAge() + " yrs / " + patient.getGender(), valueFont);
            addCell(infoTable, "Sample ID", labelFont);
            addCell(infoTable, sample.getSampleCode(), valueFont);

            addCell(infoTable, "Collection Date", labelFont);
            addCell(infoTable, sample.getCollectionDate().format(DATE_TIME_FMT), valueFont);
            addCell(infoTable, "Completion Date", labelFont);
            addCell(infoTable, result.getCompletedDate().format(DATE_TIME_FMT), valueFont);
            document.add(infoTable);

            PdfPTable resultTable = new PdfPTable(5);
            resultTable.setWidthPercentage(100);
            resultTable.setSpacingAfter(14);
            addHeaderCell(resultTable, "Test Name");
            addHeaderCell(resultTable, "Category");
            addHeaderCell(resultTable, "Measured Result");
            addHeaderCell(resultTable, "Reference Range");
            addHeaderCell(resultTable, "Status");

            addCell(resultTable, test.getTestName(), valueFont);
            addCell(resultTable, test.getCategory().name(), valueFont);
            addCell(resultTable, result.getMeasuredValue() + " " + result.getUnit(), valueFont);
            addCell(resultTable, result.getReferenceRange(), valueFont);
            addCell(resultTable, result.getResultStatus().name(), valueFont);
            document.add(resultTable);

            if (result.getRemarks() != null && !result.getRemarks().isBlank()) {
                Paragraph remarks = new Paragraph("Clinical Remarks: " + result.getRemarks(), valueFont);
                remarks.setSpacingAfter(14);
                document.add(remarks);
            }

            Paragraph auth = new Paragraph(
                    "Authorized By: " + report.getAuthorizedByName() + " (" + report.getAuthorizedByRole() + ")",
                    labelFont
            );
            auth.setSpacingAfter(6);
            document.add(auth);

            Paragraph note = new Paragraph(
                    "Note: Sample demonstration data for academic laboratory workflow verification; not a substitute for clinical diagnosis.",
                    subFont
            );
            document.add(note);

            // Also write plain-text metadata index alongside PDF for File Handling read demonstration
            writeMetadataFile(metaPath, report);
            return pdfPath;
        } catch (IOException | DocumentException ex) {
            throw new UncheckedIOException(new IOException("Failed to generate PDF report: " + ex.getMessage(), ex));
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
            }
            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException ignored) {
                    // Close safely
                }
            }
        }
    }

    public byte[] readPdfBytes(String filePath) {
        Path path = Paths.get(filePath).toAbsolutePath().normalize();
        try {
            if (!Files.exists(path)) {
                throw new FileNotFoundException("Report PDF file not found at: " + path);
            }
            return Files.readAllBytes(path);
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to read stored report file: " + ex.getMessage(), ex);
        }
    }

    public String readReportMetadataSummary(String pdfFilePath) {
        Path metaPath = Paths.get(pdfFilePath.replace(".pdf", ".meta.txt"));
        if (!Files.exists(metaPath)) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = Files.newBufferedReader(metaPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
            return sb.toString();
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to read report metadata file", ex);
        }
    }

    private void writeMetadataFile(Path metaPath, MedicalReport report) throws IOException {
        try (BufferedWriter writer = Files.newBufferedWriter(metaPath, StandardCharsets.UTF_8)) {
            writer.write("ReportCode=" + report.getReportCode());
            writer.newLine();
            writer.write("GeneratedDate=" + report.getGeneratedDate());
            writer.newLine();
            writer.write("AuthorizedBy=" + report.getAuthorizedByName() + " (" + report.getAuthorizedByRole() + ")");
            writer.newLine();
        }
    }

    private void addHeaderCell(PdfPTable table, String text) {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, Color.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(text, headerFont));
        cell.setBackgroundColor(new Color(22, 22, 22));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setPadding(6);
        table.addCell(cell);
    }
}
