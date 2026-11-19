-- Diagnostic Laboratory Management System — MySQL Schema
CREATE DATABASE IF NOT EXISTS diagnostic_lab_db;
USE diagnostic_lab_db;

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    registration_date DATE NOT NULL,
    INDEX idx_patient_name (full_name),
    INDEX idx_patient_code (patient_code)
);

CREATE TABLE IF NOT EXISTS laboratory_tests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_code VARCHAR(32) NOT NULL UNIQUE,
    test_category VARCHAR(32) NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    sample_type VARCHAR(80) NOT NULL,
    normal_range VARCHAR(120) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    processing_procedure TEXT NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_test_category (test_category)
);

CREATE TABLE IF NOT EXISTS laboratory_staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(80) NOT NULL,
    department VARCHAR(80) NOT NULL,
    qualification VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS samples (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sample_code VARCHAR(32) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    laboratory_test_id BIGINT NOT NULL,
    collection_date DATETIME NOT NULL,
    status VARCHAR(24) NOT NULL,
    processing_notes TEXT,
    processed_at DATETIME NULL,
    CONSTRAINT fk_sample_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_sample_test FOREIGN KEY (laboratory_test_id) REFERENCES laboratory_tests(id) ON DELETE RESTRICT,
    INDEX idx_sample_status (status),
    INDEX idx_sample_code (sample_code)
);

CREATE TABLE IF NOT EXISTS test_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sample_id BIGINT NOT NULL UNIQUE,
    measured_value VARCHAR(80) NOT NULL,
    unit VARCHAR(40) NOT NULL,
    reference_range VARCHAR(120) NOT NULL,
    result_status VARCHAR(24) NOT NULL,
    remarks TEXT,
    completed_date DATETIME NOT NULL,
    verified_by_staff_id BIGINT NULL,
    CONSTRAINT fk_result_sample FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
    CONSTRAINT fk_result_staff FOREIGN KEY (verified_by_staff_id) REFERENCES laboratory_staff(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_code VARCHAR(32) NOT NULL UNIQUE,
    test_result_id BIGINT NOT NULL UNIQUE,
    generated_date DATETIME NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    authorized_by_name VARCHAR(120) NOT NULL,
    authorized_by_role VARCHAR(80) NOT NULL,
    CONSTRAINT fk_report_result FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE CASCADE
);
