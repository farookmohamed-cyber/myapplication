package com.laboratory.repository;

import com.laboratory.model.LaboratoryTest;
import com.laboratory.model.TestCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LaboratoryTestRepository extends JpaRepository<LaboratoryTest, Long> {
    Optional<LaboratoryTest> findByTestCode(String testCode);
    List<LaboratoryTest> findByCategory(TestCategory category);
}
