package com.laboratory.controller;

import com.laboratory.model.Sample;
import com.laboratory.model.SampleStatus;
import com.laboratory.processing.TestProcessingReport;
import com.laboratory.service.SampleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/samples")
public class SampleController {

    private final SampleService sampleService;

    public SampleController(SampleService sampleService) {
        this.sampleService = sampleService;
    }

    public record CollectRequest(Long patientId, Long testId, SampleStatus status) {}
    public record StatusRequest(SampleStatus status) {}
    public record BatchProcessRequest(List<Long> sampleIds) {}

    @GetMapping
    public List<Sample> list(@RequestParam(required = false) SampleStatus status) {
        return sampleService.findAll(status);
    }

    @PostMapping
    public ResponseEntity<Sample> collect(@RequestBody CollectRequest req) {
        Sample saved = sampleService.collectSample(req.patientId(), req.testId(), req.status());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/status")
    public Sample updateStatus(@PathVariable Long id, @RequestBody StatusRequest req) {
        return sampleService.updateStatus(id, req.status());
    }

    @PostMapping("/{id}/process")
    public TestProcessingReport processSingle(@PathVariable Long id) {
        return sampleService.processSingle(id);
    }

    @PostMapping("/process-batch")
    public List<TestProcessingReport> processBatch(@RequestBody(required = false) BatchProcessRequest req) {
        List<Long> ids = req != null ? req.sampleIds() : null;
        return sampleService.processBatch(ids);
    }
}
