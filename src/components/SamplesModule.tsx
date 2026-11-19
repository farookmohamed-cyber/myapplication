import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { labApi } from '../api/labApi';
import type { LaboratoryTest, Patient, Sample, SampleStatus } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
  onGoToProcessing: () => void;
}

const STATUSES: SampleStatus[] = ['REGISTERED', 'COLLECTED', 'PROCESSING', 'COMPLETED'];

function statusChipClass(status: SampleStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'status-chip status-chip--ok';
    case 'PROCESSING':
      return 'status-chip status-chip--info';
    case 'COLLECTED':
      return 'status-chip status-chip--warn';
    default:
      return 'status-chip';
  }
}

export default function SamplesModule({ onNotify, onDataChanged, onGoToProcessing }: Props) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [filterStatus, setFilterStatus] = useState<SampleStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patientId, setPatientId] = useState('');
  const [testId, setTestId] = useState('');
  const [initialStatus, setInitialStatus] = useState<SampleStatus>('COLLECTED');

  const loadAll = async (statusFilter: SampleStatus | 'ALL' = filterStatus) => {
    setLoading(true);
    try {
      const [smpList, patList, tstList] = await Promise.all([
        labApi.getSamples(statusFilter === 'ALL' ? undefined : statusFilter),
        labApi.getPatients(),
        labApi.getTests(),
      ]);
      setSamples(smpList);
      setPatients(patList);
      setTests(tstList);
      if (!patientId && patList.length > 0) setPatientId(String(patList[0].id));
      if (!testId && tstList.length > 0) setTestId(String(tstList[0].id));
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load sample collection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll('ALL');
  }, []);

  const handleCollect = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId || !testId) {
      onNotify('error', 'Select both a patient and a laboratory test.');
      return;
    }
    setSaving(true);
    try {
      const created = await labApi.collectSample({
        patientId: Number(patientId),
        testId: Number(testId),
        status: initialStatus,
      });
      onNotify('success', `Generated unique Sample ID ${created.sampleCode}.`);
      await loadAll();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to collect sample');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (sample: Sample, nextStatus: SampleStatus) => {
    setSaving(true);
    try {
      await labApi.updateSampleStatus(sample.id, nextStatus);
      onNotify('success', `Sample ${sample.sampleCode} moved to ${nextStatus}.`);
      await loadAll();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update sample status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Sample <span className="serif-italic">Collection</span> & Tracking
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Generate unique HashSet-tracked Sample IDs, link patients to diagnostic tests, and track lifecycle status.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onGoToProcessing}>
          Go to Test Processing
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleCollect} className="glass-panel flex flex-col gap-4 p-5">
        <h3 className="text-base font-medium text-white">Collect New Specimen</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Select Patient *</label>
            <select
              required
              className="lab-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientCode} — {p.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Select Laboratory Test *</label>
            <select
              required
              className="lab-select"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.testName} ({t.sampleType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Initial Sample Status</label>
            <select
              className="lab-select"
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as SampleStatus)}
            >
              <option value="REGISTERED">Registered</option>
              <option value="COLLECTED">Collected</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-solid" disabled={saving || !patients.length || !tests.length}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate Sample ID & Save
          </button>
        </div>
      </form>

      <div className="module-subnav">
        <button
          type="button"
          className={`module-pill ${filterStatus === 'ALL' ? 'is-active' : ''}`}
          onClick={() => {
            setFilterStatus('ALL');
            loadAll('ALL');
          }}
        >
          All Samples
        </button>
        {STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            className={`module-pill ${filterStatus === st ? 'is-active' : ''}`}
            onClick={() => {
              setFilterStatus(st);
              loadAll(st);
            }}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading samples...
          </div>
        ) : samples.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">No samples in this status.</div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Patient</th>
                  <th>Laboratory Test</th>
                  <th>Collection Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-white tabular-nums">{s.sampleCode}</td>
                    <td>
                      <div>{s.patient?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-[#9a9a9a]">{s.patient?.patientCode}</div>
                    </td>
                    <td>
                      <div>{s.laboratoryTest?.testName || 'Unknown'}</div>
                      <div className="text-xs text-[#9a9a9a]">{s.laboratoryTest?.category}</div>
                    </td>
                    <td className="tabular-nums">{s.collectionDate.replace('T', ' ').slice(0, 16)}</td>
                    <td>
                      <span className={statusChipClass(s.status)}>{s.status}</span>
                    </td>
                    <td>
                      <select
                        className="lab-select max-w-[160px]"
                        value={s.status}
                        disabled={saving}
                        onChange={(e) => handleStatusChange(s, e.target.value as SampleStatus)}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
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
