import type {
  AdminSession,
  DashboardSummary,
  Gender,
  LabEvent,
  LaboratoryStaff,
  LaboratoryTest,
  MedicalReport,
  Patient,
  ResultStatus,
  Sample,
  SampleStatus,
  TestCategory,
  TestProcessingReport,
  TestResult,
} from '../types/lab';

export interface PatientPayload {
  fullName: string;
  age: number;
  gender: Gender;
  phoneNumber: string;
  email: string;
  address: string;
  registrationDate?: string;
}

export interface TestPayload {
  category: TestCategory;
  testName: string;
  price: number;
  sampleType: string;
  normalRange: string;
  unit: string;
  processingProcedure: string;
  estimatedMinutes: number;
  active?: boolean;
}

export interface StaffPayload {
  fullName: string;
  role: string;
  department: string;
  qualification: string;
  email: string;
  phone: string;
  active?: boolean;
}

export interface LabServiceInterface {
  getDashboard(): Promise<DashboardSummary>;

  // Patients
  getPatients(search?: string): Promise<Patient[]>;
  createPatient(payload: PatientPayload): Promise<Patient>;
  updatePatient(id: number, payload: PatientPayload): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Laboratory Tests
  getTests(category?: TestCategory): Promise<LaboratoryTest[]>;
  createTest(payload: TestPayload): Promise<LaboratoryTest>;
  updateTest(id: number, payload: TestPayload): Promise<LaboratoryTest>;
  deleteTest(id: number): Promise<void>;

  // Samples & Processing
  getSamples(status?: SampleStatus): Promise<Sample[]>;
  collectSample(payload: {
    patientId: number;
    testId: number;
    status?: SampleStatus;
  }): Promise<Sample>;
  updateSampleStatus(id: number, status: SampleStatus): Promise<Sample>;
  processSample(id: number): Promise<TestProcessingReport>;
  processBatch(sampleIds?: number[]): Promise<TestProcessingReport[]>;

  // Test Results
  getResults(): Promise<TestResult[]>;
  recordResult(payload: {
    sampleId: number;
    measuredValue: string;
    remarks: string;
    verifiedByStaffId?: number;
    resultStatus?: ResultStatus;
  }): Promise<TestResult>;

  // Reports & PDF Download
  getReports(): Promise<MedicalReport[]>;
  generateReport(testResultId: number): Promise<MedicalReport>;
  downloadReportPdf(reportId: number, reportCode: string): Promise<void>;

  // Admin & Events
  adminLogin(username: string, password: string): Promise<AdminSession>;
  getStaff(): Promise<LaboratoryStaff[]>;
  createStaff(payload: StaffPayload): Promise<LaboratoryStaff>;
  updateStaff(id: number, payload: StaffPayload): Promise<LaboratoryStaff>;
  deleteStaff(id: number): Promise<void>;
  getEvents(): Promise<LabEvent[]>;
}
