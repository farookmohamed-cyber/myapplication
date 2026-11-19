package com.laboratory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "laboratory_staff")
public class LaboratoryStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_code", nullable = false, unique = true, length = 32)
    private String staffCode;

    @NotBlank(message = "Staff full name is required")
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @NotBlank(message = "Role is required")
    @Column(nullable = false, length = 80)
    private String role;

    @NotBlank(message = "Department is required")
    @Column(nullable = false, length = 80)
    private String department;

    @NotBlank(message = "Qualification is required")
    @Column(nullable = false, length = 120)
    private String qualification;

    @NotBlank(message = "Email is required")
    @Column(nullable = false, length = 150)
    private String email;

    @NotBlank(message = "Phone is required")
    @Column(nullable = false, length = 32)
    private String phone;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    public LaboratoryStaff() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStaffCode() { return staffCode; }
    public void setStaffCode(String staffCode) { this.staffCode = staffCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
