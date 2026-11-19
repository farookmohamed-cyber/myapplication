export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type TestCategory =
  | 'BLOOD_TEST'
  | 'URINE_TEST'
  | 'BIOCHEMISTRY_TEST'
  | 'HEMATOLOGY_TEST'
  | 'MICROBIOLOGY_TEST';

export type SampleStatus = 'REGISTERED' | 'COLLECTED' | 'PROCESSING' | 'COMPLETED';

export type ResultStatus = 'NORMAL' | 'ABNORMAL' | 'CRITICAL';

export type LabEventType =
  | 'PATIENT_REGISTERED'
  | 'SAMPLE_COLLECTED'
  | 'TEST_COMPLETED'
  | 'REPORT_GENERATED';

export type ActiveModule =
  | 'overview'
  | 'dashboard'
  | 'patients'
  | 'tests'
  | 'samples'
  | 'processing'
  | 'results'
  | 'reports'
  | 'admin';

export interface Patient {
  id: number;
  patientCode: string;
  fullName: string;
  age: number;
  gender: Gender;
  phoneNumber: string;
  email: string;
  address: string;
  registrationDate: string;
}

export interface LaboratoryTest {
  id: number;
  testCode: string;
  category: TestCategory;
  testName: string;
  price: number;
  sampleType: string;
  normalRange: string;
  unit: string;
  processingProcedure: string;
  estimatedMinutes: number;
  active: boolean;
}

export interface LaboratoryStaff {
  id: number;
  staffCode: string;
  fullName: string;
  role: string;
  department: string;
  qualification: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Sample {
  id: number;
  sampleCode: string;
  patientId?: number;
  testId?: number;
  patient: Patient | null;
  laboratoryTest: LaboratoryTest | null;
  collectionDate: string;
  status: SampleStatus;
  processingNotes: string | null;
  processedAt: string | null;
}

export interface TestResult {
  id: number;
  sampleId?: number;
  sample: Sample | null;
  measuredValue: string;
  unit: string;
  referenceRange: string;
  resultStatus: ResultStatus;
  remarks: string;
  completedDate: string;
  verifiedBy: LaboratoryStaff | null;
}

export interface MedicalReport {
  id: number;
  reportCode: string;
  testResultId?: number;
  testResult: TestResult | null;
  generatedDate: string;
  filePath: string;
  authorizedByName: string;
  authorizedByRole: string;
  labInfo?: {
    name: string;
    address: string;
    phone: string;
    accreditation: string;
  };
}

export interface LabEvent {
  eventId: string;
  type: LabEventType;
  entityCode: string;
  message: string;
  timestamp: string;
}

export interface DashboardSummary {
  totalPatients: number;
  totalTests: number;
  pendingSamples: number;
  completedTests: number;
  totalResults: number;
  totalReports: number;
  pendingQueueSize: number;
  categoryStatistics: Record<TestCategory, number>;
  recentActivities: LabEvent[];
}

export interface TestProcessingReport {
  sampleCode: string;
  testName: string;
  category: TestCategory;
  processorClass: string;
  threadName: string;
  protocolSteps: string[];
  summaryNotes: string;
  processedAt: string;
}

export interface AdminSession {
  authenticated: boolean;
  token: string;
  username: string;
  role: string;
}
