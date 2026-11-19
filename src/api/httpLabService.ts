import type {
  AdminSession,
  DashboardSummary,
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
import type {
  LabServiceInterface,
  PatientPayload,
  StaffPayload,
  TestPayload,
} from './labServiceInterface';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    const target = API_BASE || window.location.origin;
    const detail = err instanceof Error ? err.message : 'Network error';
    throw new Error(
      `Unable to reach backend API at ${target} (${detail}). Ensure your Java Spring Boot server is running or set VITE_LAB_MODE="demo".`
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.message) message = errBody.message;
    } catch {
      // Fallback to HTTP status
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/**
 * Real Java Spring Boot REST API adapter.
 * Activated when VITE_API_BASE_URL is configured or VITE_LAB_MODE=backend.
 */
export const httpLabService: LabServiceInterface = {
  getDashboard: () => request<DashboardSummary>('/api/dashboard'),

  getPatients: (search = '') =>
    request<Patient[]>(
      search.trim()
        ? `/api/patients?search=${encodeURIComponent(search.trim())}`
        : '/api/patients'
    ),
  createPatient: (payload: PatientPayload) =>
    request<Patient>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePatient: (id: number, payload: PatientPayload) =>
    request<Patient>(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePatient: (id: number) =>
    request<void>(`/api/patients/${id}`, {
      method: 'DELETE',
    }),

  getTests: (category?: TestCategory) =>
    request<LaboratoryTest[]>(category ? `/api/tests?category=${category}` : '/api/tests'),
  createTest: (payload: TestPayload) =>
    request<LaboratoryTest>('/api/tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTest: (id: number, payload: TestPayload) =>
    request<LaboratoryTest>(`/api/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTest: (id: number) =>
    request<void>(`/api/tests/${id}`, {
      method: 'DELETE',
    }),

  getSamples: (status?: SampleStatus) =>
    request<Sample[]>(status ? `/api/samples?status=${status}` : '/api/samples'),
  collectSample: (payload: { patientId: number; testId: number; status?: SampleStatus }) =>
    request<Sample>('/api/samples', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSampleStatus: (id: number, status: SampleStatus) =>
    request<Sample>(`/api/samples/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  processSample: (id: number) =>
    request<TestProcessingReport>(`/api/samples/${id}/process`, {
      method: 'POST',
    }),
  processBatch: (sampleIds?: number[]) =>
    request<TestProcessingReport[]>('/api/samples/process-batch', {
      method: 'POST',
      body: JSON.stringify({ sampleIds }),
    }),

  getResults: () => request<TestResult[]>('/api/results'),
  recordResult: (payload: {
    sampleId: number;
    measuredValue: string;
    remarks: string;
    verifiedByStaffId?: number;
    resultStatus?: ResultStatus;
  }) =>
    request<TestResult>('/api/results', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReports: () => request<MedicalReport[]>('/api/reports'),
  generateReport: (testResultId: number) =>
    request<MedicalReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ testResultId }),
    }),
  downloadReportPdf: async (reportId: number, reportCode: string) => {
    const urlPath = `${API_BASE}/api/reports/${reportId}/pdf`;
    let res: Response;
    try {
      res = await fetch(urlPath);
    } catch (err) {
      const target = API_BASE || window.location.origin;
      const detail = err instanceof Error ? err.message : 'Network error';
      throw new Error(`Unable to download PDF from ${target} (${detail}).`);
    }
    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  adminLogin: (username: string, password: string) =>
    request<AdminSession>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getStaff: () => request<LaboratoryStaff[]>('/api/admin/staff'),
  createStaff: (payload: StaffPayload) =>
    request<LaboratoryStaff>('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStaff: (id: number, payload: StaffPayload) =>
    request<LaboratoryStaff>(`/api/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteStaff: (id: number) =>
    request<void>(`/api/admin/staff/${id}`, {
      method: 'DELETE',
    }),
  getEvents: () => request<LabEvent[]>('/api/admin/events'),
};
