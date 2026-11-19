package com.laboratory.controller;

import com.laboratory.events.LabEvent;
import com.laboratory.events.LabEventPublisher;
import com.laboratory.model.LaboratoryStaff;
import com.laboratory.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final LabEventPublisher eventPublisher;

    public AdminController(AdminService adminService, LabEventPublisher eventPublisher) {
        this.adminService = adminService;
        this.eventPublisher = eventPublisher;
    }

    public record LoginRequest(String username, String password) {}

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        return adminService.authenticate(req.username(), req.password());
    }

    @GetMapping("/staff")
    public List<LaboratoryStaff> listStaff() {
        return adminService.findAllStaff();
    }

    @PostMapping("/staff")
    public ResponseEntity<LaboratoryStaff> createStaff(@Valid @RequestBody LaboratoryStaff staff) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStaff(staff));
    }

    @PutMapping("/staff/{id}")
    public LaboratoryStaff updateStaff(@PathVariable Long id, @Valid @RequestBody LaboratoryStaff staff) {
        return adminService.updateStaff(id, staff);
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        adminService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events")
    public List<LabEvent> listEvents() {
        return eventPublisher.getRecentEvents();
    }
}
