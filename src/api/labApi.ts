import { demoLabService, resetDemoStore } from './demoLabService';
import { httpLabService } from './httpLabService';
import type { LabServiceInterface } from './labServiceInterface';

export type LabExecutionMode = 'demo' | 'backend';

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const configuredMode = (import.meta.env.VITE_LAB_MODE || '').trim().toLowerCase();

/**
 * Keeps Temporary Demonstration Mode strictly separated from Real Backend Mode:
 * - If VITE_LAB_MODE is explicitly "demo", always stay in Demonstration Mode.
 * - Backend Mode is used when VITE_LAB_MODE="backend", or when VITE_LAB_MODE is unset and VITE_API_BASE_URL is configured.
 * - Demonstration Mode is the default so the frontend preview runs without SPRING_BOOT_API_URL.
 */
export function getLabExecutionMode(): LabExecutionMode {
  if (configuredMode === 'demo') {
    return 'demo';
  }
  if (configuredMode === 'backend' || configuredBaseUrl.length > 0) {
    return 'backend';
  }
  return 'demo';
}

export function isDemoMode(): boolean {
  return getLabExecutionMode() === 'demo';
}

export function getActiveLabService(): LabServiceInterface {
  return isDemoMode() ? demoLabService : httpLabService;
}

export const labApi: LabServiceInterface = {
  getDashboard: () => getActiveLabService().getDashboard(),
  getPatients: (search) => getActiveLabService().getPatients(search),
  createPatient: (payload) => getActiveLabService().createPatient(payload),
  updatePatient: (id, payload) => getActiveLabService().updatePatient(id, payload),
  deletePatient: (id) => getActiveLabService().deletePatient(id),
  getTests: (category) => getActiveLabService().getTests(category),
  createTest: (payload) => getActiveLabService().createTest(payload),
  updateTest: (id, payload) => getActiveLabService().updateTest(id, payload),
  deleteTest: (id) => getActiveLabService().deleteTest(id),
  getSamples: (status) => getActiveLabService().getSamples(status),
  collectSample: (payload) => getActiveLabService().collectSample(payload),
  updateSampleStatus: (id, status) => getActiveLabService().updateSampleStatus(id, status),
  processSample: (id) => getActiveLabService().processSample(id),
  processBatch: (sampleIds) => getActiveLabService().processBatch(sampleIds),
  getResults: () => getActiveLabService().getResults(),
  recordResult: (payload) => getActiveLabService().recordResult(payload),
  getReports: () => getActiveLabService().getReports(),
  generateReport: (testResultId) => getActiveLabService().generateReport(testResultId),
  downloadReportPdf: (reportId, reportCode) =>
    getActiveLabService().downloadReportPdf(reportId, reportCode),
  adminLogin: (username, password) => getActiveLabService().adminLogin(username, password),
  getStaff: () => getActiveLabService().getStaff(),
  createStaff: (payload) => getActiveLabService().createStaff(payload),
  updateStaff: (id, payload) => getActiveLabService().updateStaff(id, payload),
  deleteStaff: (id) => getActiveLabService().deleteStaff(id),
  getEvents: () => getActiveLabService().getEvents(),
};

export { demoLabService, httpLabService, resetDemoStore };
