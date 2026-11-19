package com.laboratory.repository;

import com.laboratory.model.Sample;
import com.laboratory.model.SampleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SampleRepository extends JpaRepository<Sample, Long> {
    Optional<Sample> findBySampleCode(String sampleCode);
    List<Sample> findByStatus(SampleStatus status);
    long countByStatusNot(SampleStatus status);
    long countByStatus(SampleStatus status);
}
