import type {
  AdminSession,
  DashboardSummary,
  LabEvent,
  LabEventType,
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
import type {
  LabServiceInterface,
  PatientPayload,
  StaffPayload,
  TestPayload,
} from './labServiceInterface';

const DEMO_STORAGE_KEY = 'vesper_lab_demo_store_v1';

interface DemoSampleEntity {
  id: number;
  sampleCode: string;
  patientId: number;
  testId: number;
  collectionDate: string;
  status: SampleStatus;
  processingNotes: string | null;
  processedAt: string | null;
}

interface DemoResultEntity {
  id: number;
  sampleId: number;
  measuredValue: string;
  unit: string;
  referenceRange: string;
  resultStatus: ResultStatus;
  remarks: string;
  completedDate: string;
  verifiedByStaffId: number | null;
}

interface DemoReportEntity {
  id: number;
  reportCode: string;
  testResultId: number;
  generatedDate: string;
  filePath: string;
  authorizedByName: string;
  authorizedByRole: string;
}

interface DemoStoreState {
  counters: {
    patientId: number;
    patientCode: number;
    testId: number;
    testCode: number;
    sampleId: number;
    sampleCode: number;
    resultId: number;
    staffId: number;
    staffCode: number;
    reportId: number;
    reportCode: number;
  };
  patients: Patient[];
  tests: LaboratoryTest[];
  samples: DemoSampleEntity[];
  results: DemoResultEntity[];
  staff: LaboratoryStaff[];
  reports: DemoReportEntity[];
  events: LabEvent[];
}

const DEMO_LAB_INFO = {
  name: 'Vesper.ai Clinical Diagnostics Laboratory (Demo Mode)',
  address: '420 BioMed Parkway, Suite 300, Clinical Research District',
  phone: '+1 (800) 555-0194',
  accreditation: 'Temporary Demonstration Facility — Sample Data Only',
};

function makeEvent(type: LabEventType, entityCode: string, message: string): LabEvent {
  return {
    eventId: `EVT-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
    type,
    entityCode,
    message,
    timestamp: new Date().toISOString(),
  };
}

function createInitialDemoStore(): DemoStoreState {
  const year = new Date().getFullYear();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const staff: LaboratoryStaff[] = [
    {
      id: 1,
      staffCode: 'STF-0401',
      fullName: 'Dr. Elena Vance, MD (Sample Demo)',
      role: 'Chief Clinical Pathologist',
      department: 'Hematology & Serology',
      qualification: 'MD Pathology, FCAP',
      email: 'e.vance@demo.invalid',
      phone: '+1-555-0140',
      active: true,
    },
    {
      id: 2,
      staffCode: 'STF-0402',
      fullName: 'Marcus Chen, MSc (Sample Demo)',
      role: 'Senior Clinical Biochemist',
      department: 'Biochemistry & Microbiology',
      qualification: 'MSc Clinical Biochemistry',
      email: 'm.chen@demo.invalid',
      phone: '+1-555-0141',
      active: true,
    },
  ];

  const tests: LaboratoryTest[] = [
    {
      id: 1,
      testCode: 'TST-0501',
      category: 'BLOOD_TEST',
      testName: 'Fasting Plasma Glucose (Demo)',
      price: 28,
      sampleType: 'Whole Blood (Fluoride)',
      normalRange: '70 - 99',
      unit: 'mg/dL',
      processingProcedure: 'Centrifuge fluoride-oxalate tube and run hexokinase photometric assay',
      estimatedMinutes: 25,
      active: true,
    },
    {
      id: 2,
      testCode: 'TST-0502',
      category: 'URINE_TEST',
      testName: 'Complete Urinalysis Panel (Demo)',
      price: 22,
      sampleType: 'Midstream Urine',
      normalRange: 'Negative / Clear',
      unit: 'Qualitative',
      processingProcedure: 'Dipstick chemical strip followed by centrifuged sediment microscopy',
      estimatedMinutes: 20,
      active: true,
    },
    {
      id: 3,
      testCode: 'TST-0503',
      category: 'BIOCHEMISTRY_TEST',
      testName: 'Serum Creatinine Assay (Demo)',
      price: 35,
      sampleType: 'Serum (SST)',
      normalRange: '0.7 - 1.3',
      unit: 'mg/dL',
      processingProcedure: 'Kinetic Jaffe enzymatic colorimetric reaction on serum aliquot',
      estimatedMinutes: 30,
      active: true,
    },
    {
      id: 4,
      testCode: 'TST-0504',
      category: 'HEMATOLOGY_TEST',
      testName: 'Complete Blood Count — Hemoglobin (Demo)',
      price: 40,
      sampleType: 'Whole Blood (EDTA)',
      normalRange: '13.0 - 17.0',
      unit: 'g/dL',
      processingProcedure: 'Automated 5-part impedance cell counter and Wright-Giemsa peripheral smear',
      estimatedMinutes: 25,
      active: true,
    },
    {
      id: 5,
      testCode: 'TST-0505',
      category: 'MICROBIOLOGY_TEST',
      testName: 'Throat Swab Culture & Sensitivity (Demo)',
      price: 55,
      sampleType: 'Sterile Swab',
      normalRange: 'No Pathogen Growth',
      unit: 'CFU/mL',
      processingProcedure: 'Aseptic blood agar inoculation, 37C incubation, and Gram stain screening',
      estimatedMinutes: 60,
      active: true,
    },
  ];

  const patients: Patient[] = [
    {
      id: 1,
      patientCode: `PAT-${year}-1001`,
      fullName: 'Aarav Sharma (Sample Demo)',
      age: 34,
      gender: 'MALE',
      phoneNumber: '+1-555-0181',
      email: 'aarav.demo@example.org',
      address: '118 Oakridge Avenue, North Wing',
      registrationDate: today,
    },
    {
      id: 2,
      patientCode: `PAT-${year}-1002`,
      fullName: 'Priya Nair (Sample Demo)',
      age: 29,
      gender: 'FEMALE',
      phoneNumber: '+1-555-0182',
      email: 'priya.demo@example.org',
      address: '42 Maple Street, West District',
      registrationDate: today,
    },
    {
      id: 3,
      patientCode: `PAT-${year}-1003`,
      fullName: 'Daniel Brooks (Sample Demo)',
      age: 51,
      gender: 'MALE',
      phoneNumber: '+1-555-0183',
      email: 'daniel.demo@example.org',
      address: '905 Riverfront Drive',
      registrationDate: today,
    },
  ];

  const samples: DemoSampleEntity[] = [
    {
      id: 1,
      sampleCode: `SMP-${year}-2001`,
      patientId: 1,
      testId: 1,
      collectionDate: now,
      status: 'COMPLETED',
      processingNotes: 'Demonstration BloodTest workflow completed',
      processedAt: now,
    },
    {
      id: 2,
      sampleCode: `SMP-${year}-2002`,
      patientId: 2,
      testId: 3,
      collectionDate: now,
      status: 'COMPLETED',
      processingNotes: 'Demonstration BiochemistryTest workflow completed',
      processedAt: now,
    },
    {
      id: 3,
      sampleCode: `SMP-${year}-2003`,
      patientId: 3,
      testId: 4,
      collectionDate: now,
      status: 'COLLECTED',
      processingNotes: null,
      processedAt: null,
    },
    {
      id: 4,
      sampleCode: `SMP-${year}-2004`,
      patientId: 1,
      testId: 5,
      collectionDate: now,
      status: 'COLLECTED',
      processingNotes: null,
      processedAt: null,
    },
  ];

  const results: DemoResultEntity[] = [
    {
      id: 1,
      sampleId: 1,
      measuredValue: '88',
      unit: 'mg/dL',
      referenceRange: '70 - 99',
      resultStatus: 'NORMAL',
      remarks: 'Sample demonstration value within reference range (not a medical diagnosis).',
      completedDate: now,
      verifiedByStaffId: 1,
    },
    {
      id: 2,
      sampleId: 2,
      measuredValue: '1.6',
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      resultStatus: 'ABNORMAL',
      remarks: 'Sample demonstration value flagged outside reference range (not a medical diagnosis).',
      completedDate: now,
      verifiedByStaffId: 2,
    },
  ];

  const reports: DemoReportEntity[] = [
    {
      id: 1,
      reportCode: `RPT-${year}-3001`,
      testResultId: 1,
      generatedDate: now,
      filePath: `demo://reports/RPT-${year}-3001.pdf`,
      authorizedByName: staff[0].fullName,
      authorizedByRole: staff[0].role,
    },
    {
      id: 2,
      reportCode: `RPT-${year}-3002`,
      testResultId: 2,
      generatedDate: now,
      filePath: `demo://reports/RPT-${year}-3002.pdf`,
      authorizedByName: staff[1].fullName,
      authorizedByRole: staff[1].role,
    },
  ];

  const events: LabEvent[] = [
    makeEvent('REPORT_GENERATED', reports[1].reportCode, `[Demo] Generated report ${reports[1].reportCode} for ${samples[1].sampleCode}`),
    makeEvent('TEST_COMPLETED', samples[1].sampleCode, `[Demo] Validated result for ${tests[2].testName} (ABNORMAL)`),
    makeEvent('REPORT_GENERATED', reports[0].reportCode, `[Demo] Generated report ${reports[0].reportCode} for ${samples[0].sampleCode}`),
    makeEvent('SAMPLE_COLLECTED', samples[3].sampleCode, `[Demo] Sample ${samples[3].sampleCode} collected for ${patients[0].fullName}`),
    makeEvent('PATIENT_REGISTERED', patients[2].patientCode, `[Demo] Registered patient ${patients[2].fullName}`),
  ];

  return {
    counters: {
      patientId: 4,
      patientCode: 1004,
      testId: 6,
      testCode: 506,
      sampleId: 5,
      sampleCode: 2005,
      resultId: 3,
      staffId: 3,
      staffCode: 403,
      reportId: 3,
      reportCode: 3003,
    },
    patients,
    tests,
    samples,
    results,
    staff,
    reports,
    events,
  };
}

let inMemoryFallback: DemoStoreState | null = null;

function readDemoStore(): DemoStoreState {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoStoreState;
      inMemoryFallback = parsed;
      return parsed;
    }
  } catch {
    // Ignore storage access errors in restricted iframe environments
  }
  if (inMemoryFallback) {
    return inMemoryFallback;
  }
  const initial = createInitialDemoStore();
  writeDemoStore(initial);
  return initial;
}

function writeDemoStore(state: DemoStoreState): void {
  inMemoryFallback = state;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or security errors in restricted environments
  }
}

export function resetDemoStore(): void {
  const initial = createInitialDemoStore();
  writeDemoStore(initial);
}

function pushEvent(state: DemoStoreState, type: LabEventType, entityCode: string, message: string): void {
  state.events.unshift(makeEvent(type, entityCode, message));
  if (state.events.length > 50) {
    state.events = state.events.slice(0, 50);
  }
}

function hydrateSample(state: DemoStoreState, s: DemoSampleEntity): Sample {
  return {
    id: s.id,
    sampleCode: s.sampleCode,
    patientId: s.patientId,
    testId: s.testId,
    patient: state.patients.find((p) => p.id === s.patientId) || null,
    laboratoryTest: state.tests.find((t) => t.id === s.testId) || null,
    collectionDate: s.collectionDate,
    status: s.status,
    processingNotes: s.processingNotes,
    processedAt: s.processedAt,
  };
}

function hydrateResult(state: DemoStoreState, r: DemoResultEntity): TestResult {
  const smp = state.samples.find((s) => s.id === r.sampleId);
  return {
    id: r.id,
    sampleId: r.sampleId,
    sample: smp ? hydrateSample(state, smp) : null,
    measuredValue: r.measuredValue,
    unit: r.unit,
    referenceRange: r.referenceRange,
    resultStatus: r.resultStatus,
    remarks: r.remarks,
    completedDate: r.completedDate,
    verifiedBy: state.staff.find((st) => st.id === r.verifiedByStaffId) || null,
  };
}

function hydrateReport(state: DemoStoreState, rp: DemoReportEntity): MedicalReport {
  const res = state.results.find((r) => r.id === rp.testResultId);
  return {
    id: rp.id,
    reportCode: rp.reportCode,
    testResultId: rp.testResultId,
    testResult: res ? hydrateResult(state, res) : null,
    generatedDate: rp.generatedDate,
    filePath: rp.filePath,
    authorizedByName: rp.authorizedByName,
    authorizedByRole: rp.authorizedByRole,
    labInfo: DEMO_LAB_INFO,
  };
}

function getCategorySteps(test: LaboratoryTest, sample: DemoSampleEntity) {
  switch (test.category) {
    case 'BLOOD_TEST':
      return {
        processorClass: 'BloodTest',
        steps: [
          `1. Verify venipuncture blood specimen integrity and barcode (${sample.sampleCode})`,
          '2. Centrifuge whole blood at 3,200 RPM for 10 minutes to separate plasma fraction',
          '3. Run automated immunoassay and baseline serology calibration',
          `4. Cross-check QC against normal reference window (${test.normalRange} ${test.unit})`,
        ],
        summaryNotes: `Demo BloodTest simulation completed via ${test.processingProcedure}`,
      };
    case 'URINE_TEST':
      return {
        processorClass: 'UrineTest',
        steps: [
          `1. Inspect physical color, clarity, and specific gravity of specimen ${sample.sampleCode}`,
          '2. Perform multi-parameter colorimetric reagent strip urinalysis',
          '3. Centrifuge 10 mL aliquot at 2,000 RPM for 5 minutes',
          `4. Examine urinary sediment under phase-contrast microscopy against ${test.normalRange}`,
        ],
        summaryNotes: `Demo UrineTest simulation completed via ${test.processingProcedure}`,
      };
    case 'BIOCHEMISTRY_TEST':
      return {
        processorClass: 'BiochemistryTest',
        steps: [
          `1. Clot-activate and separate serum fraction for sample ${sample.sampleCode}`,
          '2. Calibrate clinical chemistry analyzer using dual-point enzymatic standards',
          '3. Measure spectrophotometric absorbance at 340 nm / 546 nm',
          `4. Validate kinetic reaction slope and compare to ${test.normalRange} ${test.unit}`,
        ],
        summaryNotes: `Demo BiochemistryTest simulation completed via ${test.processingProcedure}`,
      };
    case 'HEMATOLOGY_TEST':
      return {
        processorClass: 'HematologyTest',
        steps: [
          `1. Confirm EDTA anticoagulation and absence of micro-clots in ${sample.sampleCode}`,
          '2. Aspirate specimen through automated 5-part laser flow-cytometry analyzer',
          '3. Prepare peripheral blood smear and stain with Wright-Giemsa',
          `4. Verify cellular indices and histogram flags against ${test.normalRange} ${test.unit}`,
        ],
        summaryNotes: `Demo HematologyTest simulation completed via ${test.processingProcedure}`,
      };
    case 'MICROBIOLOGY_TEST':
      return {
        processorClass: 'MicrobiologyTest',
        steps: [
          `1. Perform aseptic biosafety cabinet inoculation of specimen ${sample.sampleCode}`,
          '2. Incubate culture plates at 37C under controlled aerobic/CO2 atmosphere',
          '3. Execute Gram stain microscopy and colony morphology screening',
          `4. Conduct antimicrobial susceptibility profiling against ${test.normalRange}`,
        ],
        summaryNotes: `Demo MicrobiologyTest simulation completed via ${test.processingProcedure}`,
      };
  }
}

function evaluateValue(measuredValue: string, normalRange: string): ResultStatus {
  const norm = measuredValue.trim().toLowerCase();
  if (!norm) throw new Error('Measured value cannot be empty.');
  if (norm.includes('positive') || norm.includes('reactive') || norm.includes('detected')) {
    return 'ABNORMAL';
  }
  if (norm.includes('negative') || norm.includes('non-reactive') || norm.includes('clear')) {
    return 'NORMAL';
  }
  const match = normalRange.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  const numericClean = measuredValue.replace(/[^0-9.-]/g, '');
  if (match && numericClean && !Number.isNaN(Number(numericClean))) {
    const val = Number(numericClean);
    if (val < 0) {
      throw new Error(`Numeric laboratory measurement cannot be negative: ${measuredValue}`);
    }
    const low = Number(match[1]);
    const high = Number(match[2]);
    if (val < low * 0.7 || val > high * 1.35) return 'CRITICAL';
    if (val < low || val > high) return 'ABNORMAL';
    return 'NORMAL';
  }
  return 'NORMAL';
}

function escapePdfText(input: string): string {
  return String(input)
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildClientPdfBlob(report: MedicalReport): Blob {
  const res = report.testResult;
  const smp = res?.sample;
  const pat = smp?.patient;
  const tst = smp?.laboratoryTest;

  const lines: Array<{ text: string; size?: number; bold?: boolean; gap?: number }> = [
    { text: report.labInfo?.name || DEMO_LAB_INFO.name, size: 14, bold: true, gap: 18 },
    { text: `${DEMO_LAB_INFO.address}  |  ${DEMO_LAB_INFO.phone}`, size: 9, gap: 13 },
    { text: DEMO_LAB_INFO.accreditation, size: 9, gap: 22 },
    { text: 'DIAGNOSTIC LABORATORY MEDICAL REPORT (DEMONSTRATION)', size: 11.5, bold: true, gap: 18 },
    { text: '---------------------------------------------------------------------------------------------', size: 9, gap: 14 },
    { text: `Report ID: ${report.reportCode}          Generated: ${report.generatedDate.replace('T', ' ').slice(0, 16)}`, size: 10, bold: true, gap: 16 },
    { text: `Patient ID: ${pat?.patientCode || '-'}          Patient Name: ${pat?.fullName || '-'}`, size: 10, gap: 15 },
    { text: `Age / Gender: ${pat?.age ?? '-'} yrs / ${pat?.gender || '-'}          Phone: ${pat?.phoneNumber || '-'}`, size: 10, gap: 15 },
    { text: `Sample ID: ${smp?.sampleCode || '-'}          Collection Date: ${smp?.collectionDate.replace('T', ' ').slice(0, 16) || '-'}`, size: 10, gap: 15 },
    { text: `Completion Date: ${res?.completedDate.replace('T', ' ').slice(0, 16) || '-'}`, size: 10, gap: 20 },
    { text: '---------------------------------------------------------------------------------------------', size: 9, gap: 14 },
    { text: 'LABORATORY TEST & RESULT SUMMARY', size: 11, bold: true, gap: 18 },
    { text: `Test Name: ${tst?.testName || '-'} (${tst?.testCode || '-'})`, size: 10, bold: true, gap: 15 },
    { text: `Category: ${tst?.category || '-'}          Specimen: ${tst?.sampleType || '-'}`, size: 10, gap: 15 },
    { text: `Measured Result: ${res?.measuredValue || '-'} ${res?.unit || ''}`, size: 11, bold: true, gap: 16 },
    { text: `Normal Reference Range: ${res?.referenceRange || '-'} ${res?.unit || ''}`, size: 10, gap: 15 },
    { text: `Result Status: ${res?.resultStatus || '-'}`, size: 10, bold: true, gap: 18 },
  ];

  if (res?.remarks) {
    lines.push({ text: `Remarks: ${res.remarks.slice(0, 90)}`, size: 9.5, gap: 16 });
  }

  lines.push({ text: '---------------------------------------------------------------------------------------------', size: 9, gap: 16 });
  lines.push({ text: `Authorized Laboratory Staff: ${report.authorizedByName}`, size: 10, bold: true, gap: 14 });
  lines.push({ text: `Designation: ${report.authorizedByRole}`, size: 9.5, gap: 20 });
  lines.push({ text: 'NOTICE: Generated in Temporary Demonstration Mode using sample data.', size: 8.5, gap: 12 });
  lines.push({ text: 'Not stored in MySQL and not a clinical medical diagnosis.', size: 8.5, gap: 12 });

  const ops: string[] = ['BT'];
  let y = 785;
  for (const item of lines) {
    const size = item.size ?? 10;
    const font = item.bold ? '/F2' : '/F1';
    const gap = item.gap ?? Math.round(size * 1.45);
    if (y < 52) break;
    ops.push(`${font} ${size} Tf`);
    ops.push(`1 0 0 1 46 ${y} Tm`);
    ops.push(`(${escapePdfText(item.text)}) Tj`);
    y -= gap;
  }
  ops.push('ET');

  const streamContent = ops.join('\n');
  const encoder = new TextEncoder();
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${encoder.encode(streamContent).length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Temporary Browser Demonstration Mode service.
 * Completely separate from real backend mode; operates standalone without SPRING_BOOT_API_URL or MySQL.
 */
export const demoLabService: LabServiceInterface = {
  async getDashboard(): Promise<DashboardSummary> {
    const state = readDemoStore();
    const categoryStatistics: Record<TestCategory, number> = {
      BLOOD_TEST: 0,
      URINE_TEST: 0,
      BIOCHEMISTRY_TEST: 0,
      HEMATOLOGY_TEST: 0,
      MICROBIOLOGY_TEST: 0,
    };
    for (const t of state.tests) {
      categoryStatistics[t.category] = (categoryStatistics[t.category] || 0) + 1;
    }
    return {
      totalPatients: state.patients.length,
      totalTests: state.tests.length,
      pendingSamples: state.samples.filter((s) => s.status !== 'COMPLETED').length,
      completedTests: state.samples.filter((s) => s.status === 'COMPLETED').length,
      totalResults: state.results.length,
      totalReports: state.reports.length,
      pendingQueueSize: state.samples.filter((s) => s.status === 'COLLECTED' || s.status === 'REGISTERED').length,
      categoryStatistics,
      recentActivities: state.events.slice(0, 15),
    };
  },

  async getPatients(search = ''): Promise<Patient[]> {
    const state = readDemoStore();
    const q = search.trim().toLowerCase();
    if (!q) return [...state.patients];
    return state.patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientCode.toLowerCase().includes(q) ||
        p.phoneNumber.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  },

  async createPatient(payload: PatientPayload): Promise<Patient> {
    const state = readDemoStore();
    const year = new Date().getFullYear();
    const created: Patient = {
      id: state.counters.patientId++,
      patientCode: `PAT-${year}-${state.counters.patientCode++}`,
      fullName: payload.fullName.trim(),
      age: Number(payload.age),
      gender: payload.gender,
      phoneNumber: payload.phoneNumber.trim(),
      email: payload.email.trim(),
      address: payload.address.trim(),
      registrationDate: payload.registrationDate || new Date().toISOString().slice(0, 10),
    };
    state.patients.unshift(created);
    pushEvent(state, 'PATIENT_REGISTERED', created.patientCode, `[Demo] Registered patient ${created.fullName} (${created.patientCode})`);
    writeDemoStore(state);
    return created;
  },

  async updatePatient(id: number, payload: PatientPayload): Promise<Patient> {
    const state = readDemoStore();
    const idx = state.patients.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Patient not found with ID: ${id}`);
    state.patients[idx] = {
      ...state.patients[idx],
      fullName: payload.fullName.trim(),
      age: Number(payload.age),
      gender: payload.gender,
      phoneNumber: payload.phoneNumber.trim(),
      email: payload.email.trim(),
      address: payload.address.trim(),
      registrationDate: payload.registrationDate || state.patients[idx].registrationDate,
    };
    writeDemoStore(state);
    return state.patients[idx];
  },

  async deletePatient(id: number): Promise<void> {
    const state = readDemoStore();
    const idx = state.patients.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Patient not found with ID: ${id}`);
    state.patients.splice(idx, 1);
    const removedSamples = new Set(state.samples.filter((s) => s.patientId === id).map((s) => s.id));
    state.samples = state.samples.filter((s) => s.patientId !== id);
    const removedResults = new Set(state.results.filter((r) => removedSamples.has(r.sampleId)).map((r) => r.id));
    state.results = state.results.filter((r) => !removedSamples.has(r.sampleId));
    state.reports = state.reports.filter((rp) => !removedResults.has(rp.testResultId));
    writeDemoStore(state);
  },

  async getTests(category?: TestCategory): Promise<LaboratoryTest[]> {
    const state = readDemoStore();
    return category ? state.tests.filter((t) => t.category === category) : [...state.tests];
  },

  async createTest(payload: TestPayload): Promise<LaboratoryTest> {
    const state = readDemoStore();
    const created: LaboratoryTest = {
      id: state.counters.testId++,
      testCode: `TST-${String(state.counters.testCode++).padStart(4, '0')}`,
      category: payload.category,
      testName: payload.testName.trim(),
      price: Number(payload.price),
      sampleType: payload.sampleType.trim(),
      normalRange: payload.normalRange.trim(),
      unit: payload.unit.trim(),
      processingProcedure: payload.processingProcedure.trim(),
      estimatedMinutes: Number(payload.estimatedMinutes) || 30,
      active: true,
    };
    state.tests.push(created);
    writeDemoStore(state);
    return created;
  },

  async updateTest(id: number, payload: TestPayload): Promise<LaboratoryTest> {
    const state = readDemoStore();
    const idx = state.tests.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Laboratory test not found with ID: ${id}`);
    state.tests[idx] = {
      ...state.tests[idx],
      category: payload.category || state.tests[idx].category,
      testName: payload.testName.trim(),
      price: Number(payload.price),
      sampleType: payload.sampleType.trim(),
      normalRange: payload.normalRange.trim(),
      unit: payload.unit.trim(),
      processingProcedure: payload.processingProcedure.trim(),
      estimatedMinutes: Number(payload.estimatedMinutes) || state.tests[idx].estimatedMinutes,
      active: typeof payload.active === 'boolean' ? payload.active : state.tests[idx].active,
    };
    writeDemoStore(state);
    return state.tests[idx];
  },

  async deleteTest(id: number): Promise<void> {
    const state = readDemoStore();
    const idx = state.tests.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Laboratory test not found with ID: ${id}`);
    if (state.samples.some((s) => s.testId === id)) {
      throw new Error('Cannot delete a test referenced by active demonstration samples.');
    }
    state.tests.splice(idx, 1);
    writeDemoStore(state);
  },

  async getSamples(status?: SampleStatus): Promise<Sample[]> {
    const state = readDemoStore();
    const filtered = status ? state.samples.filter((s) => s.status === status) : state.samples;
    return filtered.map((s) => hydrateSample(state, s));
  },

  async collectSample(payload): Promise<Sample> {
    const state = readDemoStore();
    const patient = state.patients.find((p) => p.id === payload.patientId);
    if (!patient) throw new Error(`Patient not found with ID: ${payload.patientId}`);
    const test = state.tests.find((t) => t.id === payload.testId);
    if (!test) throw new Error(`Laboratory test not found with ID: ${payload.testId}`);

    const year = new Date().getFullYear();
    const created: DemoSampleEntity = {
      id: state.counters.sampleId++,
      sampleCode: `SMP-${year}-${state.counters.sampleCode++}`,
      patientId: patient.id,
      testId: test.id,
      collectionDate: new Date().toISOString(),
      status: payload.status || 'COLLECTED',
      processingNotes: null,
      processedAt: null,
    };
    state.samples.unshift(created);
    pushEvent(state, 'SAMPLE_COLLECTED', created.sampleCode, `[Demo] Sample ${created.sampleCode} collected for ${patient.fullName}`);
    writeDemoStore(state);
    return hydrateSample(state, created);
  },

  async updateSampleStatus(id: number, status: SampleStatus): Promise<Sample> {
    const state = readDemoStore();
    const sample = state.samples.find((s) => s.id === id);
    if (!sample) throw new Error(`Sample not found with ID: ${id}`);
    sample.status = status;
    if (status === 'COLLECTED') {
      pushEvent(state, 'SAMPLE_COLLECTED', sample.sampleCode, `[Demo] Sample ${sample.sampleCode} marked COLLECTED`);
    }
    writeDemoStore(state);
    return hydrateSample(state, sample);
  },

  async processSample(id: number): Promise<TestProcessingReport> {
    const state = readDemoStore();
    const sample = state.samples.find((s) => s.id === id);
    if (!sample) throw new Error(`Sample not found with ID: ${id}`);
    if (sample.status === 'REGISTERED') {
      throw new Error(`Sample ${sample.sampleCode} must be COLLECTED before processing.`);
    }
    const test = state.tests.find((t) => t.id === sample.testId);
    if (!test) throw new Error('Assigned laboratory test not found.');

    const info = getCategorySteps(test, sample);
    const now = new Date().toISOString();
    sample.status = 'PROCESSING';
    sample.processingNotes = info.summaryNotes;
    sample.processedAt = now;
    pushEvent(state, 'TEST_COMPLETED', sample.sampleCode, `[Demo] ${info.processorClass} processed ${sample.sampleCode}`);
    writeDemoStore(state);

    return {
      sampleCode: sample.sampleCode,
      testName: test.testName,
      category: test.category,
      processorClass: info.processorClass,
      threadName: 'demo-worker-1',
      protocolSteps: info.steps,
      summaryNotes: info.summaryNotes,
      processedAt: now,
    };
  },

  async processBatch(sampleIds?: number[]): Promise<TestProcessingReport[]> {
    const state = readDemoStore();
    const targets =
      sampleIds && sampleIds.length > 0
        ? state.samples.filter((s) => sampleIds.includes(s.id))
        : state.samples.filter((s) => s.status === 'COLLECTED');

    if (targets.length === 0) {
      throw new Error('No COLLECTED samples queued for demonstration batch processing.');
    }

    const reports = await Promise.all(
      targets.map(async (sample, idx) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const test = state.tests.find((t) => t.id === sample.testId)!;
        const info = getCategorySteps(test, sample);
        const now = new Date().toISOString();
        sample.status = 'PROCESSING';
        sample.processingNotes = info.summaryNotes;
        sample.processedAt = now;
        pushEvent(
          state,
          'TEST_COMPLETED',
          sample.sampleCode,
          `[Demo] ${info.processorClass} processed ${sample.sampleCode} on demo-worker-${(idx % 4) + 1}`
        );
        return {
          sampleCode: sample.sampleCode,
          testName: test.testName,
          category: test.category,
          processorClass: info.processorClass,
          threadName: `demo-worker-${(idx % 4) + 1}`,
          protocolSteps: info.steps,
          summaryNotes: info.summaryNotes,
          processedAt: now,
        };
      })
    );

    writeDemoStore(state);
    return reports;
  },

  async getResults(): Promise<TestResult[]> {
    const state = readDemoStore();
    return state.results.map((r) => hydrateResult(state, r));
  },

  async recordResult(payload): Promise<TestResult> {
    const state = readDemoStore();
    const sample = state.samples.find((s) => s.id === payload.sampleId);
    if (!sample) throw new Error(`Sample not found with ID: ${payload.sampleId}`);
    if (sample.status === 'REGISTERED') {
      throw new Error(`Sample ${sample.sampleCode} must be collected before entering results.`);
    }
    const test = state.tests.find((t) => t.id === sample.testId);
    if (!test) throw new Error('Test definition not found.');

    const evaluatedStatus = payload.resultStatus || evaluateValue(payload.measuredValue, test.normalRange);
    const staffMember =
      state.staff.find((st) => st.id === payload.verifiedByStaffId) ||
      state.staff.find((st) => st.active) ||
      null;

    const existingIdx = state.results.findIndex((r) => r.sampleId === sample.id);
    const now = new Date().toISOString();
    let saved: DemoResultEntity;

    if (existingIdx !== -1) {
      saved = {
        ...state.results[existingIdx],
        measuredValue: payload.measuredValue.trim(),
        unit: test.unit,
        referenceRange: test.normalRange,
        resultStatus: evaluatedStatus,
        remarks: payload.remarks.trim(),
        completedDate: now,
        verifiedByStaffId: staffMember ? staffMember.id : null,
      };
      state.results[existingIdx] = saved;
    } else {
      saved = {
        id: state.counters.resultId++,
        sampleId: sample.id,
        measuredValue: payload.measuredValue.trim(),
        unit: test.unit,
        referenceRange: test.normalRange,
        resultStatus: evaluatedStatus,
        remarks: payload.remarks.trim(),
        completedDate: now,
        verifiedByStaffId: staffMember ? staffMember.id : null,
      };
      state.results.unshift(saved);
    }

    sample.status = 'COMPLETED';
    pushEvent(
      state,
      'TEST_COMPLETED',
      sample.sampleCode,
      `[Demo] Result recorded for ${test.testName} (${evaluatedStatus}): ${saved.measuredValue} ${saved.unit}`
    );
    writeDemoStore(state);
    return hydrateResult(state, saved);
  },

  async getReports(): Promise<MedicalReport[]> {
    const state = readDemoStore();
    return state.reports.map((rp) => hydrateReport(state, rp));
  },

  async generateReport(testResultId: number): Promise<MedicalReport> {
    const state = readDemoStore();
    const res = state.results.find((r) => r.id === testResultId);
    if (!res) throw new Error(`Test result not found with ID: ${testResultId}`);
    const smp = state.samples.find((s) => s.id === res.sampleId);
    const staff = state.staff.find((st) => st.id === res.verifiedByStaffId) || state.staff[0];

    let report = state.reports.find((rp) => rp.testResultId === testResultId);
    if (!report) {
      const year = new Date().getFullYear();
      const code = `RPT-${year}-${state.counters.reportCode++}`;
      report = {
        id: state.counters.reportId++,
        reportCode: code,
        testResultId,
        generatedDate: new Date().toISOString(),
        filePath: `demo://reports/${code}.pdf`,
        authorizedByName: staff ? staff.fullName : 'Dr. Elena Vance, MD (Sample Demo)',
        authorizedByRole: staff ? staff.role : 'Chief Clinical Pathologist',
      };
      state.reports.unshift(report);
      pushEvent(
        state,
        'REPORT_GENERATED',
        report.reportCode,
        `[Demo] Generated PDF report ${report.reportCode} for ${smp?.sampleCode || 'sample'}`
      );
      writeDemoStore(state);
    }

    return hydrateReport(state, report);
  },

  async downloadReportPdf(reportId: number, reportCode: string): Promise<void> {
    const state = readDemoStore();
    const raw = state.reports.find((rp) => rp.id === reportId);
    if (!raw) throw new Error(`Medical report not found with ID: ${reportId}`);
    const hydrated = hydrateReport(state, raw);
    const blob = buildClientPdfBlob(hydrated);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async adminLogin(username: string, password: string): Promise<AdminSession> {
    if (!username.trim() || password.trim().length < 4) {
      throw new Error('Enter a username and a passphrase of at least 4 characters for the demonstration session.');
    }
    return {
      authenticated: true,
      token: `demo-session-${Date.now()}`,
      username: username.trim(),
      role: 'Temporary Demonstration Administrator (Browser Session)',
    };
  },

  async getStaff(): Promise<LaboratoryStaff[]> {
    const state = readDemoStore();
    return [...state.staff];
  },

  async createStaff(payload: StaffPayload): Promise<LaboratoryStaff> {
    const state = readDemoStore();
    const created: LaboratoryStaff = {
      id: state.counters.staffId++,
      staffCode: `STF-${String(state.counters.staffCode++).padStart(4, '0')}`,
      fullName: payload.fullName.trim(),
      role: payload.role.trim(),
      department: payload.department.trim(),
      qualification: payload.qualification.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      active: typeof payload.active === 'boolean' ? payload.active : true,
    };
    state.staff.push(created);
    writeDemoStore(state);
    return created;
  },

  async updateStaff(id: number, payload: StaffPayload): Promise<LaboratoryStaff> {
    const state = readDemoStore();
    const idx = state.staff.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Staff member not found with ID: ${id}`);
    state.staff[idx] = {
      ...state.staff[idx],
      fullName: payload.fullName.trim(),
      role: payload.role.trim(),
      department: payload.department.trim(),
      qualification: payload.qualification.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      active: typeof payload.active === 'boolean' ? payload.active : state.staff[idx].active,
    };
    writeDemoStore(state);
    return state.staff[idx];
  },

  async deleteStaff(id: number): Promise<void> {
    const state = readDemoStore();
    const idx = state.staff.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Staff member not found with ID: ${id}`);
    state.staff.splice(idx, 1);
    writeDemoStore(state);
  },

  async getEvents(): Promise<LabEvent[]> {
    const state = readDemoStore();
    return [...state.events];
  },
};
