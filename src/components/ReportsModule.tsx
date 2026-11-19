import { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, X } from 'lucide-react';
import { isDemoMode, labApi } from '../api/labApi';
import type { MedicalReport, TestResult } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
}

export default function ReportsModule({ onNotify, onDataChanged }: Props) {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState('');
  const [preview, setPreview] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rptList, resList] = await Promise.all([labApi.getReports(), labApi.getResults()]);
      setReports(rptList);
      setResults(resList);
      if (!selectedResultId && resList.length > 0) {
        setSelectedResultId(String(resList[0].id));
      }
      if (!preview && rptList.length > 0) {
        setPreview(rptList[0]);
      }
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleGenerate = async () => {
    if (!selectedResultId) return;
    setBusy(true);
    try {
      const created = await labApi.generateReport(Number(selectedResultId));
      onNotify(
        'success',
        isDemoMode()
          ? `Demonstration Report ${created.reportCode} generated.`
          : `Medical Report ${created.reportCode} generated and saved on server.`
      );
      setPreview(created);
      await loadAll();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadPdf = async (report: MedicalReport) => {
    setBusy(true);
    try {
      await labApi.downloadReportPdf(report.id, report.reportCode);
      onNotify('success', `Downloaded ${report.reportCode}.pdf.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to download PDF report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Medical <span className="serif-italic">Report</span> Generation
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            {isDemoMode()
              ? 'Generate structured PDF diagnostic reports in Temporary Demonstration Mode and download valid PDFs directly.'
              : 'Generate structured PDF diagnostic reports via Java Spring Boot REST API and download binary PDFs directly.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="lab-select min-w-[260px]"
            value={selectedResultId}
            onChange={(e) => setSelectedResultId(e.target.value)}
          >
            {results.map((r) => (
              <option key={r.id} value={r.id}>
                {r.sample?.sampleCode} — {r.sample?.patient?.fullName} ({r.sample?.laboratoryTest?.testName})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-solid"
            onClick={handleGenerate}
            disabled={busy || !selectedResultId}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate Report
          </button>
        </div>
      </div>

      {preview ? (
        <div className="glass-panel flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs text-[#9a9a9a]">
                {preview.labInfo?.name || 'Vesper.ai Clinical Diagnostics Laboratory'}
              </div>
              <div className="mt-0.5 text-xs text-[#9a9a9a]">
                {preview.labInfo?.address || '420 BioMed Parkway, Suite 300'} ·{' '}
                {preview.labInfo?.phone || '+1 (800) 555-0194'} ·{' '}
                {preview.labInfo?.accreditation || 'ISO 15189:2022 Accredited Facility'}
              </div>
              <h3 className="mt-2 text-xl font-medium text-white">
                Report {preview.reportCode}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-solid"
                disabled={busy}
                onClick={() => handleDownloadPdf(preview)}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button type="button" className="module-pill" onClick={() => setPreview(null)}>
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-xs text-[#9a9a9a]">Report ID</span>
              <span className="font-medium text-white tabular-nums">{preview.reportCode}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Patient ID</span>
              <span className="tabular-nums">{preview.testResult?.sample?.patient?.patientCode}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Patient Name</span>
              <span>{preview.testResult?.sample?.patient?.fullName}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Age & Gender</span>
              <span>
                {preview.testResult?.sample?.patient?.age} yrs /{' '}
                {preview.testResult?.sample?.patient?.gender}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Test Name & Category</span>
              <span>
                {preview.testResult?.sample?.laboratoryTest?.testName} (
                {preview.testResult?.sample?.laboratoryTest?.category})
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Sample ID</span>
              <span className="tabular-nums">{preview.testResult?.sample?.sampleCode}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Sample Collection Date</span>
              <span className="tabular-nums">
                {preview.testResult?.sample?.collectionDate.replace('T', ' ').slice(0, 16)}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Test Completion Date</span>
              <span className="tabular-nums">
                {preview.testResult?.completedDate.replace('T', ' ').slice(0, 16)}
              </span>
            </div>
          </div>

          <div className="glass-panel-soft grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            <div>
              <span className="block text-xs text-[#9a9a9a]">Measured Test Result</span>
              <span className="text-lg font-semibold text-white tabular-nums">
                {preview.testResult?.measuredValue} {preview.testResult?.unit}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Normal Reference Range</span>
              <span className="text-sm text-[#d8d8d8] tabular-nums">
                {preview.testResult?.referenceRange} {preview.testResult?.unit}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Result Status</span>
              <span
                className={`mt-1 ${
                  preview.testResult?.resultStatus === 'NORMAL'
                    ? 'status-chip status-chip--ok'
                    : preview.testResult?.resultStatus === 'CRITICAL'
                    ? 'status-chip status-chip--danger'
                    : 'status-chip status-chip--warn'
                }`}
              >
                {preview.testResult?.resultStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-[#9a9a9a]">
            <span>
              Authorized Laboratory Staff:{' '}
              <strong className="text-white">{preview.authorizedByName}</strong> ({preview.authorizedByRole})
            </span>
            <span>Sample demonstration report for academic verification — not a clinical diagnosis.</span>
          </div>
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading generated medical reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">No medical reports generated yet.</div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Result</th>
                  <th>Authorized By</th>
                  <th>Generated Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rp) => (
                  <tr key={rp.id}>
                    <td className="font-medium text-white tabular-nums">{rp.reportCode}</td>
                    <td>
                      <div>{rp.testResult?.sample?.patient?.fullName}</div>
                      <div className="text-xs text-[#9a9a9a]">
                        {rp.testResult?.sample?.patient?.patientCode}
                      </div>
                    </td>
                    <td>{rp.testResult?.sample?.laboratoryTest?.testName}</td>
                    <td className="tabular-nums">
                      {rp.testResult?.measuredValue} {rp.testResult?.unit} ({rp.testResult?.resultStatus})
                    </td>
                    <td className="text-xs text-[#d8d8d8]">{rp.authorizedByName}</td>
                    <td className="tabular-nums">{rp.generatedDate.replace('T', ' ').slice(0, 16)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button type="button" className="module-pill" onClick={() => setPreview(rp)}>
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </button>
                        <button
                          type="button"
                          className="module-pill"
                          disabled={busy}
                          onClick={() => handleDownloadPdf(rp)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
