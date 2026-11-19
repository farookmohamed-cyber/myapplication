import { useEffect, useState } from 'react';
import { ArrowRight, Cpu, Loader2, Play, Zap } from 'lucide-react';
import { labApi } from '../api/labApi';
import type { Sample, TestProcessingReport } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
  onGoToResults: () => void;
}

export default function ProcessingModule({ onNotify, onDataChanged, onGoToResults }: Props) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [reports, setReports] = useState<TestProcessingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const data = await labApi.getSamples();
      setSamples(data);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, []);

  const queuedSamples = samples.filter((s) => s.status === 'COLLECTED' || s.status === 'PROCESSING');

  const handleProcessSingle = async (sample: Sample) => {
    setRunning(true);
    try {
      const report = await labApi.processSample(sample.id);
      setReports((prev) => [report, ...prev]);
      onNotify('success', `${report.processorClass}.processTest() executed for ${sample.sampleCode}.`);
      await loadSamples();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setRunning(false);
    }
  };

  const handleProcessBatch = async () => {
    const collectedIds = samples.filter((s) => s.status === 'COLLECTED').map((s) => s.id);
    if (collectedIds.length === 0) {
      onNotify('error', 'No COLLECTED samples are currently queued for concurrent processing.');
      return;
    }
    setRunning(true);
    try {
      const batchResults = await labApi.processBatch(collectedIds);
      setReports((prev) => [...batchResults, ...prev]);
      onNotify('success', `Processed ${batchResults.length} samples concurrently across worker threads.`);
      await loadSamples();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Batch processing failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Polymorphic & <span className="serif-italic">Concurrent</span> Test Processing
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Dispatches LaboratoryTest.processTest(Sample) across child subclasses using ExecutorService worker threads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-solid"
            onClick={handleProcessBatch}
            disabled={running}
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Concurrent Batch
          </button>
          <button type="button" className="btn btn-ghost" onClick={onGoToResults}>
            Enter Test Results
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3.5">
          <h3 className="text-sm font-medium text-white">
            Active Sample Queue ({queuedSamples.length})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading sample processing queue...
          </div>
        ) : queuedSamples.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">
            No collected or in-progress samples awaiting processing. Collect a new sample first.
          </div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>OOP Subclass</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queuedSamples.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-white tabular-nums">{s.sampleCode}</td>
                    <td>{s.patient?.fullName || '-'}</td>
                    <td>{s.laboratoryTest?.testName || '-'}</td>
                    <td>
                      <span className="status-chip status-chip--info">
                        {s.laboratoryTest?.category || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="status-chip">{s.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="module-pill"
                        disabled={running}
                        onClick={() => handleProcessSingle(s)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Process Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reports.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-medium text-white">Recent Polymorphic Execution Logs</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {reports.map((rep, idx) => (
              <div key={`${rep.sampleCode}-${idx}`} className="glass-panel flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-white/80" />
                    <span className="font-medium text-white">{rep.sampleCode}</span>
                    <span className="text-xs text-[#9a9a9a]">— {rep.testName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-chip status-chip--ok">{rep.processorClass}</span>
                    <span className="status-chip">{rep.threadName}</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5 text-xs text-[#d8d8d8]">
                  {rep.protocolSteps.map((step, stepIdx) => (
                    <li key={stepIdx}>{step}</li>
                  ))}
                </ul>
                <p className="text-xs text-[#9a9a9a]">{rep.summaryNotes}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
