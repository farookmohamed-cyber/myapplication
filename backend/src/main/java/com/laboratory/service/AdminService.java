package com.laboratory.service;

import com.laboratory.model.LaboratoryStaff;
import com.laboratory.repository.LaboratoryStaffRepository;
import com.laboratory.utility.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminService {

    @Value("${lab.admin.username:admin}")
    private String configuredUsername;

    @Value("${lab.admin.password:VesperLab@2026}")
    private String configuredPassword;

    private final Map<String, String> activeTokens = new ConcurrentHashMap<>();
    private final LaboratoryStaffRepository staffRepository;
    private final IdGenerator idGenerator;

    public AdminService(LaboratoryStaffRepository staffRepository, IdGenerator idGenerator) {
        this.staffRepository = staffRepository;
        this.idGenerator = idGenerator;
    }

    public Map<String, Object> authenticate(String username, String password) {
        if (username == null || password == null ||
                !configuredUsername.equals(username.trim()) ||
                !configuredPassword.equals(password)) {
            throw new IllegalArgumentException("Invalid laboratory administrator credentials.");
        }
        String token = UUID.randomUUID().toString();
        activeTokens.put(token, username.trim());
        return Map.of(
                "authenticated", true,
                "token", token,
                "username", username.trim(),
                "role", "Laboratory Administrator"
        );
    }

    public List<LaboratoryStaff> findAllStaff() {
        return staffRepository.findAll();
    }

    @Transactional
    public LaboratoryStaff createStaff(LaboratoryStaff staff) {
        staff.setId(null);
        staff.setStaffCode(idGenerator.nextStaffCode());
        if (staff.getActive() == null) {
            staff.setActive(true);
        }
        return staffRepository.save(staff);
    }

    @Transactional
    public LaboratoryStaff updateStaff(Long id, LaboratoryStaff updated) {
        LaboratoryStaff existing = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found with ID: " + id));
        existing.setFullName(updated.getFullName());
        existing.setRole(updated.getRole());
        existing.setDepartment(updated.getDepartment());
        existing.setQualification(updated.getQualification());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        if (updated.getActive() != null) {
            existing.setActive(updated.getActive());
        }
        return staffRepository.save(existing);
    }

    @Transactional
    public void deleteStaff(Long id) {
        staffRepository.deleteById(id);
    }
}
