package com.laboratory.service;

import com.laboratory.exception.TestNotFoundException;
import com.laboratory.model.*;
import com.laboratory.processing.LabCollectionRegistry;
import com.laboratory.repository.LaboratoryTestRepository;
import com.laboratory.utility.IdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TestService {

    private final LaboratoryTestRepository testRepository;
    private final IdGenerator idGenerator;
    private final LabCollectionRegistry registry;

    public TestService(
            LaboratoryTestRepository testRepository,
            IdGenerator idGenerator,
            LabCollectionRegistry registry) {
        this.testRepository = testRepository;
        this.idGenerator = idGenerator;
        this.registry = registry;
    }

    public List<LaboratoryTest> findAll(TestCategory category) {
        List<LaboratoryTest> tests = (category != null)
                ? testRepository.findByCategory(category)
                : testRepository.findAll();
        if (category == null) {
            registry.indexTestCategories(tests);
        }
        return tests;
    }

    public LaboratoryTest findById(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new TestNotFoundException("Laboratory test not found with ID: " + id));
    }

    @Transactional
    public LaboratoryTest create(TestCategory category, String testName, BigDecimal price,
                                 String sampleType, String normalRange, String unit,
                                 String processingProcedure, Integer estimatedMinutes) {
        LaboratoryTest test = instantiateSubclass(category);
        test.setTestCode(idGenerator.nextTestCode());
        test.setTestName(testName);
        test.setPrice(price);
        test.setSampleType(sampleType);
        test.setNormalRange(normalRange);
        test.setUnit(unit);
        test.setProcessingProcedure(processingProcedure);
        test.setEstimatedMinutes(estimatedMinutes != null ? estimatedMinutes : 30);
        test.setActive(true);
        LaboratoryTest saved = testRepository.save(test);
        registry.indexTestCategories(testRepository.findAll());
        return saved;
    }

    @Transactional
    public LaboratoryTest update(Long id, String testName, BigDecimal price, String sampleType,
                                 String normalRange, String unit, String processingProcedure,
                                 Integer estimatedMinutes, Boolean active) {
        LaboratoryTest existing = findById(id);
        existing.setTestName(testName);
        existing.setPrice(price);
        existing.setSampleType(sampleType);
        existing.setNormalRange(normalRange);
        existing.setUnit(unit);
        existing.setProcessingProcedure(processingProcedure);
        if (estimatedMinutes != null) {
            existing.setEstimatedMinutes(estimatedMinutes);
        }
        if (active != null) {
            existing.setActive(active);
        }
        LaboratoryTest saved = testRepository.save(existing);
        registry.indexTestCategories(testRepository.findAll());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        LaboratoryTest existing = findById(id);
        testRepository.delete(existing);
        registry.indexTestCategories(testRepository.findAll());
    }

    public LaboratoryTest instantiateSubclass(TestCategory category) {
        if (category == null) {
            throw new TestNotFoundException("Test category must be specified.");
        }
        return switch (category) {
            case BLOOD_TEST -> new BloodTest();
            case URINE_TEST -> new UrineTest();
            case BIOCHEMISTRY_TEST -> new BiochemistryTest();
            case HEMATOLOGY_TEST -> new HematologyTest();
            case MICROBIOLOGY_TEST -> new MicrobiologyTest();
        };
    }
}
