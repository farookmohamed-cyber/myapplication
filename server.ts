import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

type Gender = 'MALE' | 'FEMALE' | 'OTHER';
type TestCategory =
  | 'BLOOD_TEST'
  | 'URINE_TEST'
  | 'BIOCHEMISTRY_TEST'
  | 'HEMATOLOGY_TEST'
  | 'MICROBIOLOGY_TEST';
type SampleStatus = 'REGISTERED' | 'COLLECTED' | 'PROCESSING' | 'COMPLETED';
type ResultStatus = 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
type LabEventType =
  | 'PATIENT_REGISTERED'
  | 'SAMPLE_COLLECTED'
  | 'TEST_COMPLETED'
  | 'REPORT_GENERATED';

interface PatientRecord {
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

interface LabTestRecord {
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

interface StaffRecord {
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

interface SampleRecord {
  id: number;
  sampleCode: string;
  patientId: number;
  testId: number;
  collectionDate: string;
  status: SampleStatus;
  processingNotes: string | null;
  processedAt: string | null;
}

interface TestResultRecord {
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

interface MedicalReportRecord {
  id: number;
  reportCode: string;
  testResultId: number;
  generatedDate: string;
  filePath: string;
  authorizedByName: string;
  authorizedByRole: string;
}

interface LabEventRecord {
  eventId: string;
  type: LabEventType;
  entityCode: string;
  message: string;
  timestamp: string;
}

interface StoreState {
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
  patients: PatientRecord[];
  tests: LabTestRecord[];
  samples: SampleRecord[];
  results: TestResultRecord[];
  staff: StaffRecord[];
  reports: MedicalReportRecord[];
  events: LabEventRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const REPORTS_DIR = path.resolve(DATA_DIR, 'reports');
const STORE_PATH = path.resolve(DATA_DIR, 'lab-store.json');

const LAB_INFO = {
  name: 'Vesper.ai Clinical Diagnostics Laboratory',
  address: '420 BioMed Parkway, Suite 300, Clinical Research District',
  phone: '+1 (800) 555-0194',
  accreditation: 'ISO 15189:2022 Accredited Facility',
};

const SPRING_BOOT_API_URL = process.env.SPRING_BOOT_API_URL?.replace(/\/$/, '') || '';
const ADMIN_USERNAME = process.env.APP_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.APP_ADMIN_PASSWORD || 'VesperLab@2026';

const activeAdminTokens = new Set<string>();

function ensureDirs(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function createEvent(type: LabEventType, entityCode: string, message: string): LabEventRecord {
  return {
    eventId: 'EVT-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    type,
    entityCode,
    message,
    timestamp: new Date().toISOString(),
  };
}

function escapePdfText(input: string): string {
  return String(input)
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildValidPdfBuffer(lines: Array<{ text: string; size?: number; bold?: boolean; gap?: number }>): Buffer {
  const ops: string[] = ['BT'];
  let y = 785;
  let lastSize = 10;

  for (const item of lines) {
    const size = item.size ?? 10;
    const font = item.bold ? '/F2' : '/F1';
    const gap = item.gap ?? Math.round(size * 1.45);
    if (y < 52) break;
    ops.push(`${font} ${size} Tf`);
    if (y === 785) {
      ops.push(`1 0 0 1 46 ${y} Tm`);
    } else {
      ops.push(`1 0 0 1 46 ${y} Tm`);
    }
    ops.push(`(${escapePdfText(item.text)}) Tj`);
    y -= gap;
    lastSize = size;
  }
  void lastSize;
  ops.push('ET');

  const streamContent = ops.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxLen) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

function generateAndSaveReportPdf(
  report: MedicalReportRecord,
  result: TestResultRecord,
  sample: SampleRecord,
  patient: PatientRecord,
  test: LabTestRecord
): string {
  ensureDirs();
  const safeName = report.reportCode.replace(/[^A-Za-z0-9_-]/g, '_');
  const pdfPath = path.join(REPORTS_DIR, `${safeName}.pdf`);
  const metaPath = path.join(REPORTS_DIR, `${safeName}.meta.txt`);

  const lines: Array<{ text: string; size?: number; bold?: boolean; gap?: number }> = [
    { text: LAB_INFO.name, size: 15, bold: true, gap: 18 },
    { text: `${LAB_INFO.address}  |  ${LAB_INFO.phone}`, size: 9, gap: 13 },
    { text: LAB_INFO.accreditation, size: 9, gap: 22 },
    { text: 'DIAGNOSTIC LABORATORY MEDICAL REPORT', size: 12, bold: true, gap: 18 },
    { text: '---------------------------------------------------------------------------------------------', size: 9, gap: 14 },
    { text: `Report ID: ${report.reportCode}          Generated: ${report.generatedDate.replace('T', ' ').slice(0, 16)}`, size: 10, bold: true, gap: 16 },
    { text: `Patient ID: ${patient.patientCode}          Patient Name: ${patient.fullName}`, size: 10, gap: 15 },
    { text: `Age / Gender: ${patient.age} yrs / ${patient.gender}          Phone: ${patient.phoneNumber}`, size: 10, gap: 15 },
    { text: `Sample ID: ${sample.sampleCode}          Collection Date: ${sample.collectionDate.replace('T', ' ').slice(0, 16)}`, size: 10, gap: 15 },
    { text: `Completion Date: ${result.completedDate.replace('T', ' ').slice(0, 16)}`, size: 10, gap: 20 },
    { text: '---------------------------------------------------------------------------------------------', size: 9, gap: 14 },
    { text: 'LABORATORY TEST & RESULT SUMMARY', size: 11, bold: true, gap: 18 },
    { text: `Test Name: ${test.testName} (${test.testCode})`, size: 10, bold: true, gap: 15 },
    { text: `Category: ${test.category}          Specimen: ${test.sampleType}`, size: 10, gap: 15 },
    { text: `Measured Result: ${result.measuredValue} ${result.unit}`, size: 11, bold: true, gap: 16 },
    { text: `Normal Reference Range: ${result.referenceRange} ${result.unit}`, size: 10, gap: 15 },
    { text: `Result Status: ${result.resultStatus}`, size: 10, bold: true, gap: 18 },
  ];

  if (result.remarks) {
    for (const chunk of wrapText(`Clinical Remarks: ${result.remarks}`, 86)) {
      lines.push({ text: chunk, size: 9.5, gap: 14 });
    }
    lines.push({ text: '', size: 8, gap: 8 });
  }

  lines.push({ text: '---------------------------------------------------------------------------------------------', size: 9, gap: 16 });
  lines.push({ text: `Authorized Laboratory Staff: ${report.authorizedByName}`, size: 10, bold: true, gap: 14 });
  lines.push({ text: `Designation: ${report.authorizedByRole}`, size: 9.5, gap: 20 });
  lines.push({ text: 'Note: Sample demonstration data for academic laboratory workflow verification;', size: 8.5, gap: 12 });
  lines.push({ text: 'this report is not a clinical diagnosis.', size: 8.5, gap: 12 });

  const pdfBuffer = buildValidPdfBuffer(lines);
  fs.writeFileSync(pdfPath, pdfBuffer);
  fs.writeFileSync(
    metaPath,
    `ReportCode=${report.reportCode}\nGeneratedDate=${report.generatedDate}\nAuthorizedBy=${report.authorizedByName} (${report.authorizedByRole})\n`,
    'utf8'
  );
  return pdfPath;
}

function getCategoryProcessorInfo(test: LabTestRecord, sample: SampleRecord): {
  processorClass: string;
  steps: string[];
  summaryNotes: string;
} {
  switch (test.category) {
    case 'BLOOD_TEST':
      return {
        processorClass: 'BloodTest',
        steps: [
          `1. Verify venipuncture blood specimen integrity and barcode (${sample.sampleCode})`,
          '2. Centrifuge whole blood at 3,200 RPM for 10 minutes to separate plasma fraction',
          '3. Run automated immunoassay and baseline serology calibration',
          `4. Cross-check quality controls against normal reference window (${test.normalRange} ${test.unit})`,
        ],
        summaryNotes: `BloodTest processor completed plasma separation and serological assay via ${test.processingProcedure}`,
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
        summaryNotes: `UrineTest processor completed dipstick reagent and microscopic sediment review via ${test.processingProcedure}`,
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
        summaryNotes: `BiochemistryTest processor completed photometric enzymatic assay via ${test.processingProcedure}`,
      };
    case 'HEMATOLOGY_TEST':
      return {
        processorClass: 'HematologyTest',
        steps: [
          `1. Confirm EDTA anticoagulation and absence of micro-clots in ${sample.sampleCode}`,
          '2. Aspirate specimen through automated 5-part laser flow-cytometry & impedance analyzer',
          '3. Prepare peripheral blood smear and stain with Wright-Giemsa',
          `4. Verify cellular indices and histogram flags against ${test.normalRange} ${test.unit}`,
        ],
        summaryNotes: `HematologyTest processor completed automated cell count & differential review via ${test.processingProcedure}`,
      };
    case 'MICROBIOLOGY_TEST':
      return {
        processorClass: 'MicrobiologyTest',
        steps: [
          `1. Perform aseptic biosafety cabinet inoculation of specimen ${sample.sampleCode} onto selective media`,
          '2. Incubate culture plates at 37C under controlled aerobic/CO2 atmosphere',
          '3. Execute Gram stain microscopy and colony morphology screening',
          `4. Conduct antimicrobial susceptibility profiling and record reference threshold (${test.normalRange})`,
        ],
        summaryNotes: `MicrobiologyTest processor completed culture incubation & Gram stain profiling via ${test.processingProcedure}`,
      };
  }
}

function evaluateResultStatus(measuredValue: string, normalRange: string): ResultStatus {
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

function seedInitialStore(): StoreState {
  const year = new Date().getFullYear();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const staff: StaffRecord[] = [
    {
      id: 1,
      staffCode: 'STF-0401',
      fullName: 'Dr. Elena Vance, MD',
      role: 'Chief Clinical Pathologist',
      department: 'Hematology & Serology',
      qualification: 'MD Pathology, FCAP',
      email: 'e.vance@vesperlab.demo',
      phone: '+1-555-0140',
      active: true,
    },
    {
      id: 2,
      staffCode: 'STF-0402',
      fullName: 'Marcus Chen, MSc',
      role: 'Senior Clinical Biochemist',
      department: 'Biochemistry & Microbiology',
      qualification: 'MSc Clinical Biochemistry',
      email: 'm.chen@vesperlab.demo',
      phone: '+1-555-0141',
      active: true,
    },
  ];

  const tests: LabTestRecord[] = [
    {
      id: 1,
      testCode: 'TST-0501',
      category: 'BLOOD_TEST',
      testName: 'Fasting Plasma Glucose',
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
      testName: 'Complete Urinalysis Panel',
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
      testName: 'Serum Creatinine Assay',
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
      testName: 'Complete Blood Count (Hemoglobin)',
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
      testName: 'Throat Swab Culture & Sensitivity',
      price: 55,
      sampleType: 'Sterile Swab',
      normalRange: 'No Pathogen Growth',
      unit: 'CFU/mL',
      processingProcedure: 'Aseptic blood agar inoculation, 37C incubation, and Gram stain screening',
      estimatedMinutes: 60,
      active: true,
    },
  ];

  const patients: PatientRecord[] = [
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

  const samples: SampleRecord[] = [
    {
      id: 1,
      sampleCode: `SMP-${year}-2001`,
      patientId: 1,
      testId: 1,
      collectionDate: now,
      status: 'COMPLETED',
      processingNotes: 'BloodTest processor completed plasma separation and serological assay',
      processedAt: now,
    },
    {
      id: 2,
      sampleCode: `SMP-${year}-2002`,
      patientId: 2,
      testId: 3,
      collectionDate: now,
      status: 'COMPLETED',
      processingNotes: 'BiochemistryTest processor completed photometric enzymatic assay',
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

  const results: TestResultRecord[] = [
    {
      id: 1,
      sampleId: 1,
      measuredValue: '88',
      unit: 'mg/dL',
      referenceRange: '70 - 99',
      resultStatus: 'NORMAL',
      remarks: 'Sample demonstration baseline within normal fasting range.',
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
      remarks: 'Sample demonstration value flagged above reference window.',
      completedDate: now,
      verifiedByStaffId: 2,
    },
  ];

  const reports: MedicalReportRecord[] = [
    {
      id: 1,
      reportCode: `RPT-${year}-3001`,
      testResultId: 1,
      generatedDate: now,
      filePath: '',
      authorizedByName: staff[0].fullName,
      authorizedByRole: staff[0].role,
    },
    {
      id: 2,
      reportCode: `RPT-${year}-3002`,
      testResultId: 2,
      generatedDate: now,
      filePath: '',
      authorizedByName: staff[1].fullName,
      authorizedByRole: staff[1].role,
    },
  ];

  for (const rpt of reports) {
    const res = results.find((r) => r.id === rpt.testResultId)!;
    const smp = samples.find((s) => s.id === res.sampleId)!;
    const pat = patients.find((p) => p.id === smp.patientId)!;
    const tst = tests.find((t) => t.id === smp.testId)!;
    rpt.filePath = generateAndSaveReportPdf(rpt, res, smp, pat, tst);
  }

  const events: LabEventRecord[] = [
    createEvent('REPORT_GENERATED', reports[1].reportCode, `Generated PDF report ${reports[1].reportCode} for ${samples[1].sampleCode}`),
    createEvent('TEST_COMPLETED', samples[1].sampleCode, `Result recorded for ${tests[2].testName} (ABNORMAL): 1.6 mg/dL`),
    createEvent('REPORT_GENERATED', reports[0].reportCode, `Generated PDF report ${reports[0].reportCode} for ${samples[0].sampleCode}`),
    createEvent('SAMPLE_COLLECTED', samples[3].sampleCode, `Sample ${samples[3].sampleCode} collected for ${patients[0].fullName}`),
    createEvent('PATIENT_REGISTERED', patients[2].patientCode, `Registered patient ${patients[2].fullName}`),
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

function loadStore(): StoreState {
  ensureDirs();
  if (!fs.existsSync(STORE_PATH)) {
    const initial = seedInitialStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreState;
}

function saveStore(state: StoreState): void {
  ensureDirs();
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function pushEvent(state: StoreState, type: LabEventType, entityCode: string, message: string): void {
  state.events.unshift(createEvent(type, entityCode, message));
  if (state.events.length > 50) {
    state.events = state.events.slice(0, 50);
  }
}

function hydrateSample(state: StoreState, sample: SampleRecord) {
  return {
    ...sample,
    patient: state.patients.find((p) => p.id === sample.patientId) || null,
    laboratoryTest: state.tests.find((t) => t.id === sample.testId) || null,
  };
}

function hydrateResult(state: StoreState, result: TestResultRecord) {
  const sample = state.samples.find((s) => s.id === result.sampleId);
  return {
    ...result,
    sample: sample ? hydrateSample(state, sample) : null,
    verifiedBy: state.staff.find((st) => st.id === result.verifiedByStaffId) || null,
  };
}

function hydrateReport(state: StoreState, report: MedicalReportRecord) {
  const result = state.results.find((r) => r.id === report.testResultId);
  return {
    ...report,
    testResult: result ? hydrateResult(state, result) : null,
    labInfo: LAB_INFO,
  };
}

function errorJson(res: Response, status: number, error: string, message: string) {
  return res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error,
    message,
  });
}

async function tryProxyToSpringBoot(req: Request, res: Response): Promise<boolean> {
  if (!SPRING_BOOT_API_URL) return false;
  if (req.headers['x-vesper-proxy-hop']) return false;

  const nginxPort = process.env.NGINX_PORT;
  if (
    nginxPort &&
    (SPRING_BOOT_API_URL === `http://localhost:${nginxPort}` ||
      SPRING_BOOT_API_URL === `http://127.0.0.1:${nginxPort}`)
  ) {
    return false;
  }

  try {
    const targetUrl = `${SPRING_BOOT_API_URL}${req.originalUrl}`;
    const headers: Record<string, string> = {
      'x-vesper-proxy-hop': '1',
    };
    if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type']);
    if (req.headers['authorization']) headers['authorization'] = String(req.headers['authorization']);

    const init: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      init.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const disposition = upstream.headers.get('content-disposition');
    if (disposition) res.setHeader('content-disposition', disposition);

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
    return true;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());

  let store = loadStore();

  app.use('/api', async (req, res, next) => {
    if (await tryProxyToSpringBoot(req, res)) {
      return;
    }
    next();
  });

  // 1. Dashboard
  app.get('/api/dashboard', (_req, res) => {
    const categoryStatistics: Record<TestCategory, number> = {
      BLOOD_TEST: 0,
      URINE_TEST: 0,
      BIOCHEMISTRY_TEST: 0,
      HEMATOLOGY_TEST: 0,
      MICROBIOLOGY_TEST: 0,
    };
    for (const t of store.tests) {
      categoryStatistics[t.category] = (categoryStatistics[t.category] || 0) + 1;
    }
    const pendingSamples = store.samples.filter((s) => s.status !== 'COMPLETED').length;
    const completedTests = store.samples.filter((s) => s.status === 'COMPLETED').length;

    res.json({
      totalPatients: store.patients.length,
      totalTests: store.tests.length,
      pendingSamples,
      completedTests,
      totalResults: store.results.length,
      totalReports: store.reports.length,
      pendingQueueSize: store.samples.filter((s) => s.status === 'COLLECTED' || s.status === 'REGISTERED').length,
      categoryStatistics,
      recentActivities: store.events.slice(0, 15),
    });
  });

  // 2. Patients CRUD + Search
  app.get('/api/patients', (req, res) => {
    const q = String(req.query.search || '').trim().toLowerCase();
    const list = q
      ? store.patients.filter(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.patientCode.toLowerCase().includes(q) ||
            p.phoneNumber.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        )
      : store.patients;
    res.json(list);
  });

  app.get('/api/patients/:id', (req, res) => {
    const id = Number(req.params.id);
    const patient = store.patients.find((p) => p.id === id);
    if (!patient) return errorJson(res, 404, 'PatientNotFoundException', `Patient not found with ID: ${id}`);
    res.json(patient);
  });

  app.post('/api/patients', (req, res) => {
    const { fullName, age, gender, phoneNumber, email, address, registrationDate } = req.body || {};
    if (!fullName?.trim() || age === undefined || Number(age) < 0 || Number(age) > 130 || !gender || !phoneNumber?.trim() || !email?.trim() || !address?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'All patient fields are required and age must be 0–130.');
    }
    const year = new Date().getFullYear();
    const created: PatientRecord = {
      id: store.counters.patientId++,
      patientCode: `PAT-${year}-${store.counters.patientCode++}`,
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      address: address.trim(),
      registrationDate: registrationDate || new Date().toISOString().slice(0, 10),
    };
    store.patients.unshift(created);
    pushEvent(store, 'PATIENT_REGISTERED', created.patientCode, `Registered patient ${created.fullName} (${created.patientCode})`);
    saveStore(store);
    res.status(201).json(created);
  });

  app.put('/api/patients/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.patients.findIndex((p) => p.id === id);
    if (idx === -1) return errorJson(res, 404, 'PatientNotFoundException', `Patient not found with ID: ${id}`);
    const { fullName, age, gender, phoneNumber, email, address, registrationDate } = req.body || {};
    if (!fullName?.trim() || age === undefined || Number(age) < 0 || Number(age) > 130 || !gender || !phoneNumber?.trim() || !email?.trim() || !address?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'All patient fields are required and age must be 0–130.');
    }
    store.patients[idx] = {
      ...store.patients[idx],
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      address: address.trim(),
      registrationDate: registrationDate || store.patients[idx].registrationDate,
    };
    saveStore(store);
    res.json(store.patients[idx]);
  });

  app.delete('/api/patients/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.patients.findIndex((p) => p.id === id);
    if (idx === -1) return errorJson(res, 404, 'PatientNotFoundException', `Patient not found with ID: ${id}`);
    store.patients.splice(idx, 1);
    const removedSampleIds = new Set(store.samples.filter((s) => s.patientId === id).map((s) => s.id));
    store.samples = store.samples.filter((s) => s.patientId !== id);
    const removedResultIds = new Set(store.results.filter((r) => removedSampleIds.has(r.sampleId)).map((r) => r.id));
    store.results = store.results.filter((r) => !removedSampleIds.has(r.sampleId));
    store.reports = store.reports.filter((rp) => !removedResultIds.has(rp.testResultId));
    saveStore(store);
    res.status(204).end();
  });

  // 3. Laboratory Tests CRUD
  app.get('/api/tests', (req, res) => {
    const cat = req.query.category as TestCategory | undefined;
    const list = cat ? store.tests.filter((t) => t.category === cat) : store.tests;
    res.json(list);
  });

  app.post('/api/tests', (req, res) => {
    const { category, testName, price, sampleType, normalRange, unit, processingProcedure, estimatedMinutes } = req.body || {};
    if (!category || !testName?.trim() || Number(price) <= 0 || !sampleType?.trim() || !normalRange?.trim() || !unit?.trim() || !processingProcedure?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'All laboratory test fields and a positive price are required.');
    }
    const created: LabTestRecord = {
      id: store.counters.testId++,
      testCode: `TST-${String(store.counters.testCode++).padStart(4, '0')}`,
      category,
      testName: testName.trim(),
      price: Number(price),
      sampleType: sampleType.trim(),
      normalRange: normalRange.trim(),
      unit: unit.trim(),
      processingProcedure: processingProcedure.trim(),
      estimatedMinutes: Number(estimatedMinutes) || 30,
      active: true,
    };
    store.tests.push(created);
    saveStore(store);
    res.status(201).json(created);
  });

  app.put('/api/tests/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.tests.findIndex((t) => t.id === id);
    if (idx === -1) return errorJson(res, 404, 'TestNotFoundException', `Laboratory test not found with ID: ${id}`);
    const { category, testName, price, sampleType, normalRange, unit, processingProcedure, estimatedMinutes, active } = req.body || {};
    if (!testName?.trim() || Number(price) <= 0 || !sampleType?.trim() || !normalRange?.trim() || !unit?.trim() || !processingProcedure?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'Valid laboratory test fields and positive price are required.');
    }
    store.tests[idx] = {
      ...store.tests[idx],
      category: category || store.tests[idx].category,
      testName: testName.trim(),
      price: Number(price),
      sampleType: sampleType.trim(),
      normalRange: normalRange.trim(),
      unit: unit.trim(),
      processingProcedure: processingProcedure.trim(),
      estimatedMinutes: Number(estimatedMinutes) || store.tests[idx].estimatedMinutes,
      active: typeof active === 'boolean' ? active : store.tests[idx].active,
    };
    saveStore(store);
    res.json(store.tests[idx]);
  });

  app.delete('/api/tests/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.tests.findIndex((t) => t.id === id);
    if (idx === -1) return errorJson(res, 404, 'TestNotFoundException', `Laboratory test not found with ID: ${id}`);
    if (store.samples.some((s) => s.testId === id)) {
      return errorJson(res, 400, 'InvalidSampleException', 'Cannot delete a test that is referenced by active samples.');
    }
    store.tests.splice(idx, 1);
    saveStore(store);
    res.status(204).end();
  });

  // 4 & 5. Sample Collection + Polymorphic Concurrent Processing
  app.get('/api/samples', (req, res) => {
    const status = req.query.status as SampleStatus | undefined;
    const filtered = status ? store.samples.filter((s) => s.status === status) : store.samples;
    res.json(filtered.map((s) => hydrateSample(store, s)));
  });

  app.post('/api/samples', (req, res) => {
    const { patientId, testId, status, collectionDate } = req.body || {};
    const patient = store.patients.find((p) => p.id === Number(patientId));
    if (!patient) return errorJson(res, 404, 'PatientNotFoundException', `Patient not found with ID: ${patientId}`);
    const test = store.tests.find((t) => t.id === Number(testId));
    if (!test) return errorJson(res, 404, 'TestNotFoundException', `Laboratory test not found with ID: ${testId}`);

    const year = new Date().getFullYear();
    const created: SampleRecord = {
      id: store.counters.sampleId++,
      sampleCode: `SMP-${year}-${store.counters.sampleCode++}`,
      patientId: patient.id,
      testId: test.id,
      collectionDate: collectionDate || new Date().toISOString(),
      status: status || 'COLLECTED',
      processingNotes: null,
      processedAt: null,
    };
    store.samples.unshift(created);
    pushEvent(store, 'SAMPLE_COLLECTED', created.sampleCode, `Sample ${created.sampleCode} collected for ${patient.fullName} (${test.testName})`);
    saveStore(store);
    res.status(201).json(hydrateSample(store, created));
  });

  app.patch('/api/samples/:id/status', (req, res) => {
    const id = Number(req.params.id);
    const sample = store.samples.find((s) => s.id === id);
    if (!sample) return errorJson(res, 404, 'InvalidSampleException', `Sample not found with ID: ${id}`);
    const nextStatus = req.body?.status as SampleStatus;
    if (!['REGISTERED', 'COLLECTED', 'PROCESSING', 'COMPLETED'].includes(nextStatus)) {
      return errorJson(res, 400, 'InvalidSampleException', 'Invalid sample status requested.');
    }
    sample.status = nextStatus;
    if (nextStatus === 'COLLECTED') {
      pushEvent(store, 'SAMPLE_COLLECTED', sample.sampleCode, `Sample ${sample.sampleCode} marked COLLECTED`);
    }
    saveStore(store);
    res.json(hydrateSample(store, sample));
  });

  app.post('/api/samples/:id/process', async (req, res) => {
    const id = Number(req.params.id);
    const sample = store.samples.find((s) => s.id === id);
    if (!sample) return errorJson(res, 404, 'InvalidSampleException', `Sample not found with ID: ${id}`);
    if (sample.status === 'REGISTERED') {
      return errorJson(res, 400, 'InvalidSampleException', `Sample ${sample.sampleCode} must be COLLECTED before processing.`);
    }
    const test = store.tests.find((t) => t.id === sample.testId);
    if (!test) return errorJson(res, 404, 'TestNotFoundException', 'Assigned laboratory test not found.');

    const info = getCategoryProcessorInfo(test, sample);
    const now = new Date().toISOString();
    sample.status = 'PROCESSING';
    sample.processingNotes = info.summaryNotes;
    sample.processedAt = now;
    pushEvent(store, 'TEST_COMPLETED', sample.sampleCode, `Polymorphic ${info.processorClass} processed ${sample.sampleCode}`);
    saveStore(store);

    res.json({
      sampleCode: sample.sampleCode,
      testName: test.testName,
      category: test.category,
      processorClass: info.processorClass,
      threadName: 'lab-worker-1',
      protocolSteps: info.steps,
      summaryNotes: info.summaryNotes,
      processedAt: now,
    });
  });

  app.post('/api/samples/process-batch', async (req, res) => {
    const requestedIds: number[] | undefined = req.body?.sampleIds;
    const targets =
      requestedIds && requestedIds.length > 0
        ? store.samples.filter((s) => requestedIds.includes(s.id))
        : store.samples.filter((s) => s.status === 'COLLECTED');

    if (targets.length === 0) {
      return errorJson(res, 400, 'InvalidSampleException', 'No COLLECTED samples are queued for concurrent batch processing.');
    }

    const reports = await Promise.all(
      targets.map(async (sample, index) => {
        await new Promise((resolve) => setTimeout(resolve, 120));
        const test = store.tests.find((t) => t.id === sample.testId)!;
        const info = getCategoryProcessorInfo(test, sample);
        const now = new Date().toISOString();
        sample.status = 'PROCESSING';
        sample.processingNotes = info.summaryNotes;
        sample.processedAt = now;
        pushEvent(
          store,
          'TEST_COMPLETED',
          sample.sampleCode,
          `Polymorphic ${info.processorClass} processed ${sample.sampleCode} on lab-worker-${(index % 4) + 1}`
        );
        return {
          sampleCode: sample.sampleCode,
          testName: test.testName,
          category: test.category,
          processorClass: info.processorClass,
          threadName: `lab-worker-${(index % 4) + 1}`,
          protocolSteps: info.steps,
          summaryNotes: info.summaryNotes,
          processedAt: now,
        };
      })
    );

    saveStore(store);
    res.json(reports);
  });

  // 6. Test Results
  app.get('/api/results', (_req, res) => {
    res.json(store.results.map((r) => hydrateResult(store, r)));
  });

  app.post('/api/results', (req, res) => {
    const { sampleId, measuredValue, remarks, verifiedByStaffId, resultStatus } = req.body || {};
    const sample = store.samples.find((s) => s.id === Number(sampleId));
    if (!sample) return errorJson(res, 404, 'InvalidSampleException', `Sample not found with ID: ${sampleId}`);
    if (sample.status === 'REGISTERED') {
      return errorJson(res, 400, 'InvalidSampleException', `Sample ${sample.sampleCode} must be collected before entering results.`);
    }
    const test = store.tests.find((t) => t.id === sample.testId);
    if (!test) return errorJson(res, 404, 'TestNotFoundException', 'Test definition not found.');

    let evaluatedStatus: ResultStatus;
    try {
      evaluatedStatus = resultStatus || evaluateResultStatus(String(measuredValue || ''), test.normalRange);
    } catch (err) {
      return errorJson(res, 400, 'InvalidTestResultException', err instanceof Error ? err.message : 'Invalid test result.');
    }

    const staffMember =
      store.staff.find((st) => st.id === Number(verifiedByStaffId)) ||
      store.staff.find((st) => st.active) ||
      null;

    const existingIdx = store.results.findIndex((r) => r.sampleId === sample.id);
    const now = new Date().toISOString();
    let saved: TestResultRecord;
    if (existingIdx !== -1) {
      saved = {
        ...store.results[existingIdx],
        measuredValue: String(measuredValue).trim(),
        unit: test.unit,
        referenceRange: test.normalRange,
        resultStatus: evaluatedStatus,
        remarks: String(remarks || '').trim(),
        completedDate: now,
        verifiedByStaffId: staffMember ? staffMember.id : null,
      };
      store.results[existingIdx] = saved;
    } else {
      saved = {
        id: store.counters.resultId++,
        sampleId: sample.id,
        measuredValue: String(measuredValue).trim(),
        unit: test.unit,
        referenceRange: test.normalRange,
        resultStatus: evaluatedStatus,
        remarks: String(remarks || '').trim(),
        completedDate: now,
        verifiedByStaffId: staffMember ? staffMember.id : null,
      };
      store.results.unshift(saved);
    }

    sample.status = 'COMPLETED';
    pushEvent(
      store,
      'TEST_COMPLETED',
      sample.sampleCode,
      `Result recorded for ${test.testName} (${evaluatedStatus}): ${saved.measuredValue} ${saved.unit}`
    );
    saveStore(store);
    res.status(201).json(hydrateResult(store, saved));
  });

  // 7. Medical Reports + Downloadable PDF
  app.get('/api/reports', (_req, res) => {
    res.json(store.reports.map((rp) => hydrateReport(store, rp)));
  });

  app.post('/api/reports', (req, res) => {
    const testResultId = Number(req.body?.testResultId);
    const result = store.results.find((r) => r.id === testResultId);
    if (!result) return errorJson(res, 404, 'InvalidTestResultException', `Test result not found with ID: ${testResultId}`);
    const sample = store.samples.find((s) => s.id === result.sampleId)!;
    const patient = store.patients.find((p) => p.id === sample.patientId)!;
    const test = store.tests.find((t) => t.id === sample.testId)!;
    const staff = store.staff.find((st) => st.id === result.verifiedByStaffId) || store.staff[0];

    let report = store.reports.find((rp) => rp.testResultId === testResultId);
    if (!report) {
      const year = new Date().getFullYear();
      report = {
        id: store.counters.reportId++,
        reportCode: `RPT-${year}-${store.counters.reportCode++}`,
        testResultId,
        generatedDate: new Date().toISOString(),
        filePath: '',
        authorizedByName: staff ? staff.fullName : 'Dr. Elena Vance, MD',
        authorizedByRole: staff ? staff.role : 'Chief Clinical Pathologist',
      };
      report.filePath = generateAndSaveReportPdf(report, result, sample, patient, test);
      store.reports.unshift(report);
      pushEvent(store, 'REPORT_GENERATED', report.reportCode, `Generated PDF report ${report.reportCode} for ${sample.sampleCode}`);
      saveStore(store);
    } else {
      report.filePath = generateAndSaveReportPdf(report, result, sample, patient, test);
      saveStore(store);
    }

    res.status(201).json(hydrateReport(store, report));
  });

  app.get('/api/reports/:id/pdf', (req, res) => {
    const id = Number(req.params.id);
    const report = store.reports.find((rp) => rp.id === id);
    if (!report) return errorJson(res, 404, 'InvalidTestResultException', `Report not found with ID: ${id}`);

    const result = store.results.find((r) => r.id === report.testResultId)!;
    const sample = store.samples.find((s) => s.id === result.sampleId)!;
    const patient = store.patients.find((p) => p.id === sample.patientId)!;
    const test = store.tests.find((t) => t.id === sample.testId)!;

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      report.filePath = generateAndSaveReportPdf(report, result, sample, patient, test);
      saveStore(store);
    }

    const pdfBytes = fs.readFileSync(report.filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportCode}.pdf"`);
    res.send(pdfBytes);
  });

  // 8. Admin Management + Events
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password || String(username).trim() !== ADMIN_USERNAME || String(password) !== ADMIN_PASSWORD) {
      return errorJson(res, 401, 'AuthenticationException', 'Invalid laboratory administrator credentials.');
    }
    const token = crypto.randomUUID();
    activeAdminTokens.add(token);
    res.json({
      authenticated: true,
      token,
      username: String(username).trim(),
      role: 'Laboratory Administrator',
    });
  });

  app.get('/api/admin/staff', (_req, res) => {
    res.json(store.staff);
  });

  app.post('/api/admin/staff', (req, res) => {
    const { fullName, role, department, qualification, email, phone, active } = req.body || {};
    if (!fullName?.trim() || !role?.trim() || !department?.trim() || !qualification?.trim() || !email?.trim() || !phone?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'All laboratory staff fields are required.');
    }
    const created: StaffRecord = {
      id: store.counters.staffId++,
      staffCode: `STF-${String(store.counters.staffCode++).padStart(4, '0')}`,
      fullName: fullName.trim(),
      role: role.trim(),
      department: department.trim(),
      qualification: qualification.trim(),
      email: email.trim(),
      phone: phone.trim(),
      active: typeof active === 'boolean' ? active : true,
    };
    store.staff.push(created);
    saveStore(store);
    res.status(201).json(created);
  });

  app.put('/api/admin/staff/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.staff.findIndex((s) => s.id === id);
    if (idx === -1) return errorJson(res, 404, 'NotFound', `Staff member not found with ID: ${id}`);
    const { fullName, role, department, qualification, email, phone, active } = req.body || {};
    if (!fullName?.trim() || !role?.trim() || !department?.trim() || !qualification?.trim() || !email?.trim() || !phone?.trim()) {
      return errorJson(res, 400, 'ValidationError', 'All laboratory staff fields are required.');
    }
    store.staff[idx] = {
      ...store.staff[idx],
      fullName: fullName.trim(),
      role: role.trim(),
      department: department.trim(),
      qualification: qualification.trim(),
      email: email.trim(),
      phone: phone.trim(),
      active: typeof active === 'boolean' ? active : store.staff[idx].active,
    };
    saveStore(store);
    res.json(store.staff[idx]);
  });

  app.delete('/api/admin/staff/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = store.staff.findIndex((s) => s.id === id);
    if (idx === -1) return errorJson(res, 404, 'NotFound', `Staff member not found with ID: ${id}`);
    store.staff.splice(idx, 1);
    saveStore(store);
    res.status(204).end();
  });

  app.get('/api/admin/events', (_req, res) => {
    res.json(store.events);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Diagnostic Laboratory Management System server listening on http://localhost:${port}`);
  });
}

startServer();
