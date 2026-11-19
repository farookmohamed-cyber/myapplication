package com.laboratory.repository;

import com.laboratory.model.LaboratoryStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LaboratoryStaffRepository extends JpaRepository<LaboratoryStaff, Long> {
    List<LaboratoryStaff> findByActiveTrue();
}
