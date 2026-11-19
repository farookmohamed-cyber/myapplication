package com.laboratory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_code", nullable = false, unique = true, length = 32)
    private String patientCode;

    @NotBlank(message = "Full name is required")
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 130, message = "Age must be realistic")
    @Column(nullable = false)
    private Integer age;

    @NotNull(message = "Gender is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Gender gender;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone_number", nullable = false, length = 32)
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Column(nullable = false, length = 150)
    private String email;

    @NotBlank(message = "Address is required")
    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    public Patient() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPatientCode() { return patientCode; }
    public void setPatientCode(String patientCode) { this.patientCode = patientCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDate getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDate registrationDate) { this.registrationDate = registrationDate; }
}
