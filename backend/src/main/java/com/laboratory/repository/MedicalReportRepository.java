package com.laboratory.repository;

import com.laboratory.model.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Optional<MedicalReport> findByReportCode(String reportCode);
    Optional<MedicalReport> findByTestResultId(Long testResultId);
}
