package com.laboratory.service;

import com.laboratory.events.LabEventPublisher;
import com.laboratory.events.LabEventType;
import com.laboratory.exception.PatientNotFoundException;
import com.laboratory.model.Patient;
import com.laboratory.processing.LabCollectionRegistry;
import com.laboratory.repository.PatientRepository;
import com.laboratory.utility.IdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final IdGenerator idGenerator;
    private final LabCollectionRegistry registry;
    private final LabEventPublisher eventPublisher;

    public PatientService(
            PatientRepository patientRepository,
            IdGenerator idGenerator,
            LabCollectionRegistry registry,
            LabEventPublisher eventPublisher) {
        this.patientRepository = patientRepository;
        this.idGenerator = idGenerator;
        this.registry = registry;
        this.eventPublisher = eventPublisher;
    }

    public List<Patient> findAll(String search) {
        List<Patient> results;
        if (search != null && !search.isBlank()) {
            String q = search.trim();
            results = patientRepository
                    .findByFullNameContainingIgnoreCaseOrPatientCodeContainingIgnoreCaseOrPhoneNumberContainingIgnoreCaseOrEmailContainingIgnoreCase(
                            q, q, q, q);
        } else {
            results = patientRepository.findAll();
            registry.syncPatients(results);
        }
        return results;
    }

    public Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found with ID: " + id));
    }

    @Transactional
    public Patient create(Patient patient) {
        patient.setId(null);
        patient.setPatientCode(idGenerator.nextPatientCode());
        if (patient.getRegistrationDate() == null) {
            patient.setRegistrationDate(LocalDate.now());
        }
        Patient saved = patientRepository.save(patient);
        registry.registerPatient(saved);
        eventPublisher.publish(
                LabEventType.PATIENT_REGISTERED,
                saved.getPatientCode(),
                "Registered patient " + saved.getFullName() + " (" + saved.getPatientCode() + ")"
        );
        return saved;
    }

    @Transactional
    public Patient update(Long id, Patient updated) {
        Patient existing = findById(id);
        existing.setFullName(updated.getFullName());
        existing.setAge(updated.getAge());
        existing.setGender(updated.getGender());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setEmail(updated.getEmail());
        existing.setAddress(updated.getAddress());
        if (updated.getRegistrationDate() != null) {
            existing.setRegistrationDate(updated.getRegistrationDate());
        }
        Patient saved = patientRepository.save(existing);
        registry.registerPatient(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Patient existing = findById(id);
        patientRepository.delete(existing);
    }
}
