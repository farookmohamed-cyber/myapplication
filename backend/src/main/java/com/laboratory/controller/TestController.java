package com.laboratory.controller;

import com.laboratory.model.LaboratoryTest;
import com.laboratory.model.TestCategory;
import com.laboratory.service.TestService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    public record TestPayload(
            @NotNull TestCategory category,
            @NotBlank String testName,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @NotBlank String sampleType,
            @NotBlank String normalRange,
            @NotBlank String unit,
            @NotBlank String processingProcedure,
            Integer estimatedMinutes,
            Boolean active
    ) {}

    @GetMapping
    public List<LaboratoryTest> list(@RequestParam(required = false) TestCategory category) {
        return testService.findAll(category);
    }

    @GetMapping("/{id}")
    public LaboratoryTest getOne(@PathVariable Long id) {
        return testService.findById(id);
    }

    @PostMapping
    public ResponseEntity<LaboratoryTest> create(@RequestBody TestPayload payload) {
        LaboratoryTest created = testService.create(
                payload.category(),
                payload.testName(),
                payload.price(),
                payload.sampleType(),
                payload.normalRange(),
                payload.unit(),
                payload.processingProcedure(),
                payload.estimatedMinutes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public LaboratoryTest update(@PathVariable Long id, @RequestBody TestPayload payload) {
        return testService.update(
                id,
                payload.testName(),
                payload.price(),
                payload.sampleType(),
                payload.normalRange(),
                payload.unit(),
                payload.processingProcedure(),
                payload.estimatedMinutes(),
                payload.active()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        testService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
