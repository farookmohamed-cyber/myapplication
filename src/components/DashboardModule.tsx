import { Activity, Beaker, CheckCircle2, ClipboardList, FileText, Loader2, Users } from 'lucide-react';
import { isDemoMode, resetDemoStore } from '../api/labApi';
import type { ActiveModule, DashboardSummary, TestCategory } from '../types/lab';

interface Props {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (module: ActiveModule) => void;
  onRefresh: () => void;
}

const CATEGORY_LABELS: Record<TestCategory, string> = {
  BLOOD_TEST: 'BloodTest',
  URINE_TEST: 'UrineTest',
  BIOCHEMISTRY_TEST: 'BiochemistryTest',
  HEMATOLOGY_TEST: 'HematologyTest',
  MICROBIOLOGY_TEST: 'MicrobiologyTest',
};

export default function DashboardModule({ summary, loading, onNavigate, onRefresh }: Props) {
  const categories = Object.entries(summary?.categoryStatistics || {}) as Array<[TestCategory, number]>;
  const maxCount = Math.max(1, ...categories.map(([, count]) => count));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Laboratory <span className="serif-italic">Operations</span> Dashboard
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            {isDemoMode()
              ? 'Temporary Demonstration Mode using local sample data (not connected to MySQL).'
              : 'Real-time overview of registered patients, diagnostic panels, sample queue, and REST API activity.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDemoMode() ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                resetDemoStore();
                onRefresh();
              }}
              disabled={loading}
            >
              Reset Demo Data
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh Metrics
          </button>
          <button type="button" className="btn btn-solid" onClick={() => onNavigate('samples')}>
            Collect Sample
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="glass-panel flex items-center justify-center gap-3 p-12 text-sm text-[#9a9a9a]">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          Loading laboratory metrics from backend...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigate('patients')}
              className="glass-panel-soft flex flex-col gap-3 p-5 text-left transition hover:border-white/35"
            >
              <div className="flex items-center justify-between text-[#9a9a9a]">
                <span className="text-xs font-medium">Total Patients</span>
                <Users className="h-4 w-4 text-white/80" />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {summary?.totalPatients ?? 0}
              </div>
              <div className="text-xs text-[#9a9a9a]">
                {isDemoMode() ? 'Temporary demonstration data (browser storage)' : 'Spring Boot REST API patient registry'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('tests')}
              className="glass-panel-soft flex flex-col gap-3 p-5 text-left transition hover:border-white/35"
            >
              <div className="flex items-center justify-between text-[#9a9a9a]">
                <span className="text-xs font-medium">Total Laboratory Tests</span>
                <Beaker className="h-4 w-4 text-white/80" />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {summary?.totalTests ?? 0}
              </div>
              <div className="text-xs text-[#9a9a9a]">5 polymorphic test categories</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('processing')}
              className="glass-panel-soft flex flex-col gap-3 p-5 text-left transition hover:border-white/35"
            >
              <div className="flex items-center justify-between text-[#9a9a9a]">
                <span className="text-xs font-medium">Pending Samples</span>
                <ClipboardList className="h-4 w-4 text-white/80" />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {summary?.pendingSamples ?? 0}
              </div>
              <div className="text-xs text-[#9a9a9a]">
                {summary?.pendingQueueSize ?? 0} queued for concurrent worker pool
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="glass-panel-soft flex flex-col gap-3 p-5 text-left transition hover:border-white/35"
            >
              <div className="flex items-center justify-between text-[#9a9a9a]">
                <span className="text-xs font-medium">Completed Tests</span>
                <CheckCircle2 className="h-4 w-4 text-white/80" />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {summary?.completedTests ?? 0}
              </div>
              <div className="text-xs text-[#9a9a9a]">
                {summary?.totalReports ?? 0} downloadable PDF reports stored
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass-panel flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-white">Test Category Statistics</h3>
                  <p className="text-xs text-[#9a9a9a]">
                    {isDemoMode()
                      ? 'Sample panels across 5 diagnostic categories'
                      : 'Indexed by HashMap<TestCategory, List<LaboratoryTest>>'}
                  </p>
                </div>
                <button type="button" className="module-pill" onClick={() => onNavigate('tests')}>
                  Manage Tests
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {categories.map(([category, count]) => (
                  <div key={category} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#d8d8d8]">{CATEGORY_LABELS[category] || category}</span>
                      <span className="text-[#9a9a9a] tabular-nums">{count} active panels</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded bg-gradient-to-r from-white/50 to-white transition-all duration-300"
                        style={{ width: `${Math.max(8, Math.round((count / maxCount) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-white/80" />
                  <div>
                    <h3 className="text-base font-medium text-white">Recent Laboratory Activities</h3>
                    <p className="text-xs text-[#9a9a9a]">
                      {isDemoMode() ? 'Temporary demonstration activity log' : 'Live LabEventListener stream'}
                    </p>
                  </div>
                </div>
                <button type="button" className="module-pill" onClick={() => onNavigate('reports')}>
                  <FileText className="h-3.5 w-3.5" />
                  View Reports
                </button>
              </div>

              {!summary?.recentActivities?.length ? (
                <div className="py-8 text-center text-xs text-[#9a9a9a]">No recent events recorded yet.</div>
              ) : (
                <div className="flex max-h-64 flex-col gap-2.5 overflow-y-auto pr-1">
                  {summary.recentActivities.map((evt) => (
                    <div
                      key={evt.eventId}
                      className="glass-panel-soft flex items-start justify-between gap-3 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="status-chip status-chip--info">{evt.type}</span>
                          <span className="text-xs font-medium text-white/80">{evt.entityCode}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#d8d8d8]">{evt.message}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#9a9a9a] tabular-nums">
                        {evt.timestamp.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
