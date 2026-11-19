package com.laboratory.controller;

import com.laboratory.model.ResultStatus;
import com.laboratory.model.TestResult;
import com.laboratory.service.ResultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    public record ResultRequest(
            Long sampleId,
            String measuredValue,
            String remarks,
            Long verifiedByStaffId,
            ResultStatus resultStatus
    ) {}

    @GetMapping
    public List<TestResult> list() {
        return resultService.findAll();
    }

    @PostMapping
    public ResponseEntity<TestResult> record(@RequestBody ResultRequest req) {
        TestResult saved = resultService.recordResult(
                req.sampleId(),
                req.measuredValue(),
                req.remarks(),
                req.verifiedByStaffId(),
                req.resultStatus()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
