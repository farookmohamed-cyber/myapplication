import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { labApi } from '../api/labApi';
import type { LaboratoryStaff, ResultStatus, Sample, TestResult } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
  onReportGenerated: () => void;
}

function resultChipClass(status: ResultStatus): string {
  switch (status) {
    case 'CRITICAL':
      return 'status-chip status-chip--danger';
    case 'ABNORMAL':
      return 'status-chip status-chip--warn';
    default:
      return 'status-chip status-chip--ok';
  }
}

export default function ResultsModule({ onNotify, onDataChanged, onReportGenerated }: Props) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [staff, setStaff] = useState<LaboratoryStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sampleId, setSampleId] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [remarks, setRemarks] = useState('');
  const [staffId, setStaffId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [smpList, resList, stfList] = await Promise.all([
        labApi.getSamples(),
        labApi.getResults(),
        labApi.getStaff(),
      ]);
      setSamples(smpList);
      setResults(resList);
      setStaff(stfList);

      const readySamples = smpList.filter((s) => s.status !== 'REGISTERED');
      if (!sampleId && readySamples.length > 0) {
        const pending = readySamples.find((s) => s.status !== 'COMPLETED') || readySamples[0];
        setSampleId(String(pending.id));
      }
      if (!staffId && stfList.length > 0) {
        setStaffId(String(stfList[0].id));
      }
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load test results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedSample = samples.find((s) => s.id === Number(sampleId)) || null;
  const eligibleSamples = samples.filter((s) => s.status !== 'REGISTERED');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sampleId || !measuredValue.trim()) {
      onNotify('error', 'Select a sample and enter a measured laboratory value.');
      return;
    }
    setSaving(true);
    try {
      const saved = await labApi.recordResult({
        sampleId: Number(sampleId),
        measuredValue: measuredValue.trim(),
        remarks: remarks.trim(),
        verifiedByStaffId: staffId ? Number(staffId) : undefined,
      });
      onNotify(
        'success',
        `Result validated (${saved.resultStatus}): ${saved.measuredValue} ${saved.unit}.`
      );
      setMeasuredValue('');
      setRemarks('');
      await loadAll();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to validate or save result');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async (resultId: number) => {
    setSaving(true);
    try {
      const report = await labApi.generateReport(resultId);
      onNotify('success', `Generated medical report ${report.reportCode}.`);
      onDataChanged();
      onReportGenerated();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Test <span className="serif-italic">Results</span> & Reference Validation
        </h2>
        <p className="mt-1 text-sm text-[#9a9a9a]">
          Enter measured values, validate against normal reference ranges, flag abnormal findings, and finalize sample status.
          Values shown are clearly labeled sample demonstration data, not actual clinical diagnoses.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <h3 className="text-base font-medium text-white">Enter & Validate Laboratory Result</h3>
          {selectedSample?.laboratoryTest ? (
            <span className="text-xs text-[#9a9a9a]">
              Reference Range:{' '}
              <strong className="text-white">
                {selectedSample.laboratoryTest.normalRange} {selectedSample.laboratoryTest.unit}
              </strong>
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Collected / Processed Sample *</label>
            <select
              required
              className="lab-select"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
            >
              {eligibleSamples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sampleCode} — {s.patient?.fullName} ({s.laboratoryTest?.testName}) [{s.status}]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">
              Measured Value ({selectedSample?.laboratoryTest?.unit || 'unit'}) *
            </label>
            <input
              required
              className="lab-input"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              placeholder={selectedSample?.laboratoryTest?.normalRange || 'e.g. 92'}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Verified By Staff</label>
            <select
              className="lab-select"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.role})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Clinical Remarks (Demonstration Note)</label>
            <input
              className="lab-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional technician / pathologist observation note"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-solid" disabled={saving || eligibleSamples.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Validate & Store Result
          </button>
        </div>
      </form>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading stored laboratory results...
          </div>
        ) : results.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">No test results recorded yet.</div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Measured Result</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                  <th>Verified By</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-white tabular-nums">{r.sample?.sampleCode}</td>
                    <td>{r.sample?.patient?.fullName}</td>
                    <td>{r.sample?.laboratoryTest?.testName}</td>
                    <td className="font-medium text-white tabular-nums">
                      {r.measuredValue} {r.unit}
                    </td>
                    <td className="text-[#9a9a9a] tabular-nums">
                      {r.referenceRange} {r.unit}
                    </td>
                    <td>
                      <span className={resultChipClass(r.resultStatus)}>{r.resultStatus}</span>
                    </td>
                    <td className="text-xs text-[#d8d8d8]">{r.verifiedBy?.fullName || 'Unassigned'}</td>
                    <td>
                      <button
                        type="button"
                        className="module-pill"
                        disabled={saving}
                        onClick={() => handleGenerateReport(r.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Generate PDF
                      </button>
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
