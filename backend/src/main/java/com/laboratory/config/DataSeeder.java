package com.laboratory.config;

import com.laboratory.model.*;
import com.laboratory.repository.*;
import com.laboratory.service.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final PatientRepository patientRepository;
    private final LaboratoryTestRepository testRepository;
    private final LaboratoryStaffRepository staffRepository;
    private final PatientService patientService;
    private final TestService testService;
    private final SampleService sampleService;
    private final ResultService resultService;
    private final ReportService reportService;
    private final AdminService adminService;

    public DataSeeder(
            PatientRepository patientRepository,
            LaboratoryTestRepository testRepository,
            LaboratoryStaffRepository staffRepository,
            PatientService patientService,
            TestService testService,
            SampleService sampleService,
            ResultService resultService,
            ReportService reportService,
            AdminService adminService) {
        this.patientRepository = patientRepository;
        this.testRepository = testRepository;
        this.staffRepository = staffRepository;
        this.patientService = patientService;
        this.testService = testService;
        this.sampleService = sampleService;
        this.resultService = resultService;
        this.reportService = reportService;
        this.adminService = adminService;
    }

    @Override
    public void run(String... args) {
        if (staffRepository.count() == 0) {
            LaboratoryStaff s1 = new LaboratoryStaff();
            s1.setFullName("Dr. Elena Vance, MD");
            s1.setRole("Chief Clinical Pathologist");
            s1.setDepartment("Hematology & Serology");
            s1.setQualification("MD Pathology, FCAP");
            s1.setEmail("e.vance@vesperlab.demo");
            s1.setPhone("+1-555-0140");
            adminService.createStaff(s1);

            LaboratoryStaff s2 = new LaboratoryStaff();
            s2.setFullName("Marcus Chen, MSc");
            s2.setRole("Senior Clinical Biochemist");
            s2.setDepartment("Biochemistry & Microbiology");
            s2.setQualification("MSc Clinical Biochemistry");
            s2.setEmail("m.chen@vesperlab.demo");
            s2.setPhone("+1-555-0141");
            adminService.createStaff(s2);
        }

        if (testRepository.count() == 0) {
            testService.create(TestCategory.BLOOD_TEST, "Fasting Plasma Glucose", new BigDecimal("28.00"),
                    "Whole Blood (Fluoride)", "70 - 99", "mg/dL",
                    "Centrifuge fluoride-oxalate tube and run hexokinase photometric assay", 25);

            testService.create(TestCategory.URINE_TEST, "Complete Urinalysis Panel", new BigDecimal("22.00"),
                    "Midstream Urine", "Negative / Clear", "Qualitative",
                    "Dipstick chemical strip followed by centrifuged sediment microscopy", 20);

            testService.create(TestCategory.BIOCHEMISTRY_TEST, "Serum Creatinine Assay", new BigDecimal("35.00"),
                    "Serum (SST)", "0.7 - 1.3", "mg/dL",
                    "Kinetic Jaffe enzymatic colorimetric reaction on serum aliquot", 30);

            testService.create(TestCategory.HEMATOLOGY_TEST, "Complete Blood Count (Hemoglobin)", new BigDecimal("40.00"),
                    "Whole Blood (EDTA)", "13.0 - 17.0", "g/dL",
                    "Automated 5-part impedance cell counter and Wright-Giemsa peripheral smear", 25);

            testService.create(TestCategory.MICROBIOLOGY_TEST, "Throat Swab Culture & Sensitivity", new BigDecimal("55.00"),
                    "Sterile Swab", "No Pathogen Growth", "CFU/mL",
                    "Aseptic blood agar inoculation, 37°C incubation, and Gram stain screening", 60);
        }

        if (patientRepository.count() == 0 && testRepository.count() >= 5) {
            Patient p1 = new Patient();
            p1.setFullName("Aarav Sharma (Sample Demo)");
            p1.setAge(34);
            p1.setGender(Gender.MALE);
            p1.setPhoneNumber("+1-555-0181");
            p1.setEmail("aarav.demo@example.org");
            p1.setAddress("118 Oakridge Avenue, North Wing");
            p1.setRegistrationDate(LocalDate.now().minusDays(2));
            p1 = patientService.create(p1);

            Patient p2 = new Patient();
            p2.setFullName("Priya Nair (Sample Demo)");
            p2.setAge(29);
            p2.setGender(Gender.FEMALE);
            p2.setPhoneNumber("+1-555-0182");
            p2.setEmail("priya.demo@example.org");
            p2.setAddress("42 Maple Street, West District");
            p2.setRegistrationDate(LocalDate.now().minusDays(1));
            p2 = patientService.create(p2);

            Patient p3 = new Patient();
            p3.setFullName("Daniel Brooks (Sample Demo)");
            p3.setAge(51);
            p3.setGender(Gender.MALE);
            p3.setPhoneNumber("+1-555-0183");
            p3.setEmail("daniel.demo@example.org");
            p3.setAddress("905 Riverfront Drive");
            p3.setRegistrationDate(LocalDate.now());
            p3 = patientService.create(p3);

            var tests = testRepository.findAll();
            Sample s1 = sampleService.collectSample(p1.getId(), tests.get(0).getId(), SampleStatus.COLLECTED);
            sampleService.processSingle(s1.getId());
            TestResult r1 = resultService.recordResult(s1.getId(), "88", "Demo sample baseline within normal range.", null, null);
            reportService.generateReport(r1.getId());

            Sample s2 = sampleService.collectSample(p2.getId(), tests.get(2).getId(), SampleStatus.COLLECTED);
            sampleService.processSingle(s2.getId());
            TestResult r2 = resultService.recordResult(s2.getId(), "1.6", "Demo sample value flagged above reference range.", null, null);
            reportService.generateReport(r2.getId());

            sampleService.collectSample(p3.getId(), tests.get(3).getId(), SampleStatus.COLLECTED);
        }
    }
}
