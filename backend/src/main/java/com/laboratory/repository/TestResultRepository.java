package com.laboratory.repository;

import com.laboratory.model.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    Optional<TestResult> findBySampleId(Long sampleId);
}
