package com.laboratory.repository;

import com.laboratory.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientCode(String patientCode);
    List<Patient> findByFullNameContainingIgnoreCaseOrPatientCodeContainingIgnoreCaseOrPhoneNumberContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String patientCode, String phoneNumber, String email);
}
