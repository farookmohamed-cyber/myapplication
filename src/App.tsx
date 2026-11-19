import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { labApi } from './api/labApi';
import AdminModule from './components/AdminModule';
import DashboardModule from './components/DashboardModule';
import PatientsModule from './components/PatientsModule';
import ProcessingModule from './components/ProcessingModule';
import ReportsModule from './components/ReportsModule';
import ResultsModule from './components/ResultsModule';
import SamplesModule from './components/SamplesModule';
import TestsModule from './components/TestsModule';
import type { ActiveModule, AdminSession, DashboardSummary } from './types/lab';

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

const WORKSPACE_MODULES: Array<{ id: ActiveModule; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Patients' },
  { id: 'tests', label: 'Tests' },
  { id: 'samples', label: 'Samples' },
  { id: 'processing', label: 'Processing' },
  { id: 'results', label: 'Results' },
  { id: 'reports', label: 'Reports' },
  { id: 'admin', label: 'Admin' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshDashboard = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await labApi.getDashboard();
      setSummary(data);
    } catch {
      // Keep UI resilient if server is restarting
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Preserve exact body.menu-open class, Escape key, and >=901px resize behavior
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const handleResize = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    desktopQuery.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKey);
      desktopQuery.removeEventListener('change', handleResize);
      document.body.classList.remove('menu-open');
    };
  }, []);

  // Preserve entrance animationend + two-rAF fallback
  useEffect(() => {
    const appears = Array.from(document.querySelectorAll('.appear'));
    const heroPhoto = document.querySelector('.hero-photo');

    const forceVisible = () => {
      appears.forEach((el) => el.classList.add('is-in'));
      if (heroPhoto) heroPhoto.classList.add('is-in');
    };

    const handlers: Array<{ el: Element; fn: () => void }> = [];
    appears.forEach((el) => {
      const fn = () => el.classList.add('is-in');
      el.addEventListener('animationend', fn, { once: true });
      handlers.push({ el, fn });
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const runningOrFinished = appears.some((el) => {
          if (typeof el.getAnimations !== 'function') return false;
          return el
            .getAnimations()
            .some((anim) => anim.playState === 'running' || anim.playState === 'finished');
        });
        if (!runningOrFinished) {
          forceVisible();
        }
      });
    });

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener('animationend', fn));
    };
  }, []);

  const navigate = (mod: ActiveModule) => {
    setActiveModule(mod);
    setMenuOpen(false);
  };

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="hero-photo" aria-hidden="true">
        <video
          className="hero-video"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      <div className="page">
        <div
          className="menu-backdrop"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />

        <header className="header">
          <div className="logo" aria-hidden="true" />

          <nav id="site-nav" className="nav" aria-label="Primary">
            <button
              type="button"
              className={`nav-link appear appear--scale ${activeModule === 'dashboard' ? 'is-active' : ''}`}
              style={{ ['--d' as string]: '0.16s' }}
              onClick={() => navigate('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`nav-link appear appear--soft ${activeModule === 'patients' ? 'is-active' : ''}`}
              style={{ ['--d' as string]: '0.28s' }}
              onClick={() => navigate('patients')}
            >
              Patients
            </button>
            <button
              type="button"
              className={`nav-link appear appear--scale ${
                activeModule === 'tests' || activeModule === 'samples' || activeModule === 'processing'
                  ? 'is-active'
                  : ''
              }`}
              style={{ ['--d' as string]: '0.40s' }}
              onClick={() => navigate('samples')}
            >
              Lab Ops
            </button>
            <button
              type="button"
              className={`nav-link appear appear--soft ${
                activeModule === 'results' || activeModule === 'reports' ? 'is-active' : ''
              }`}
              style={{ ['--d' as string]: '0.52s' }}
              onClick={() => navigate('reports')}
            >
              Reports
            </button>
          </nav>

          <button
            type="button"
            className="btn btn-solid header-cta appear appear--scale"
            style={{ ['--d' as string]: '0.34s' }}
            onClick={() => navigate(activeModule === 'overview' ? 'dashboard' : 'admin')}
          >
            {activeModule === 'overview' ? 'Start for Free' : 'Admin Console'}
          </button>

          <button
            type="button"
            className="burger appear appear--scale"
            style={{ ['--d' as string]: '0.34s' }}
            aria-controls="site-nav"
            aria-expanded={menuOpen ? 'true' : 'false'}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </button>
        </header>

        {activeModule === 'overview' ? (
          <main className="hero" id="top">
            <div className="hero-copy">
              <h1 className="badge appear appear--pop" style={{ ['--d' as string]: '0.22s' }}>
                <svg className="badge-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
                </svg>
                <span className="badge-title">Diagnostic Laboratory Management System</span>
              </h1>

              <p className="lede appear appear--soft" style={{ ['--d' as string]: '0.82s' }}>
                Manage patient registrations, sample collection, polymorphic test processing, reference validation, and PDF medical reports across your diagnostic lab.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-solid appear appear--btn"
                  style={{ ['--d' as string]: '0.96s' }}
                  onClick={() => navigate('dashboard')}
                >
                  Open Lab Dashboard
                </button>
                <button
                  type="button"
                  className="btn btn-ghost appear appear--side"
                  style={{ ['--d' as string]: '1.10s' }}
                  onClick={() => navigate('processing')}
                >
                  See it in action
                </button>
              </div>
            </div>
          </main>
        ) : (
          <main className="workspace-main">
            <div className="workspace-container">
              <div className="glass-panel-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="module-subnav">
                  <button
                    type="button"
                    className="module-pill"
                    onClick={() => navigate('overview')}
                  >
                    Overview
                  </button>
                  {WORKSPACE_MODULES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`module-pill ${activeModule === m.id ? 'is-active' : ''}`}
                      onClick={() => navigate(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeModule === 'dashboard' ? (
                <DashboardModule
                  summary={summary}
                  loading={summaryLoading}
                  onNavigate={navigate}
                  onRefresh={refreshDashboard}
                />
              ) : null}

              {activeModule === 'patients' ? (
                <PatientsModule onNotify={notify} onDataChanged={refreshDashboard} />
              ) : null}

              {activeModule === 'tests' ? (
                <TestsModule onNotify={notify} onDataChanged={refreshDashboard} />
              ) : null}

              {activeModule === 'samples' ? (
                <SamplesModule
                  onNotify={notify}
                  onDataChanged={refreshDashboard}
                  onGoToProcessing={() => navigate('processing')}
                />
              ) : null}

              {activeModule === 'processing' ? (
                <ProcessingModule
                  onNotify={notify}
                  onDataChanged={refreshDashboard}
                  onGoToResults={() => navigate('results')}
                />
              ) : null}

              {activeModule === 'results' ? (
                <ResultsModule
                  onNotify={notify}
                  onDataChanged={refreshDashboard}
                  onReportGenerated={() => navigate('reports')}
                />
              ) : null}

              {activeModule === 'reports' ? (
                <ReportsModule onNotify={notify} onDataChanged={refreshDashboard} />
              ) : null}

              {activeModule === 'admin' ? (
                <AdminModule
                  session={adminSession}
                  summary={summary}
                  onLoginSuccess={setAdminSession}
                  onLogout={() => {
                    setAdminSession(null);
                    notify('success', 'Signed out from Admin Console.');
                  }}
                  onNotify={notify}
                  onNavigateTests={() => navigate('tests')}
                />
              ) : null}
            </div>
          </main>
        )}

        <footer className="stats">
          <div className="stat appear appear--stat" style={{ ['--d' as string]: '1.12s' }}>
            <svg className="stat-icon" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="stat-pill-a" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="38%" stopColor="#ffffff" />
                  <stop offset="62%" stopColor="#3a3a3a" />
                </linearGradient>
                <linearGradient id="stat-pill-b" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="38%" stopColor="#3a3a3a" />
                  <stop offset="62%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#stat-pill-a)" />
              <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#stat-pill-b)" />
              <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
            </svg>
            <span>
              {summary
                ? `${summary.completedTests} tests completed · ${summary.pendingSamples} pending`
                : '5 polymorphic test categories'}
            </span>
          </div>

          <div className="stat appear appear--stat" style={{ ['--d' as string]: '1.28s' }}>
            <svg className="stat-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
              <path
                d="M12 7.1v7.4"
                stroke="#111111"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M8.15 12.35L12 16.2l3.85-3.85"
                stroke="#111111"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span>
              {summary
                ? `${summary.totalReports} downloadable PDF reports generated`
                : 'Downloadable PDF clinical reports'}
            </span>
          </div>

          <div className="stat appear appear--stat" style={{ ['--d' as string]: '1.44s' }}>
            <svg className="stat-icon-wide" viewBox="0 0 40 22" aria-hidden="true">
              <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
              <polygon points="6.6,9.4 7.7,6.2 9.6,8.7" fill="#f4f4f4" />
              <polygon points="13.8,9.4 12.7,6.2 10.8,8.7" fill="#f4f4f4" />
              <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
              <circle cx="8.7" cy="11.8" r="0.7" fill="#1a1a1a" />
              <circle cx="11.7" cy="11.8" r="0.7" fill="#1a1a1a" />

              <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
              <circle cx="17.8" cy="9.6" r="1.7" fill="#111111" />
              <circle cx="22.6" cy="9.6" r="1.7" fill="#111111" />
              <ellipse cx="20.2" cy="11.8" rx="1.1" ry="0.75" fill="#111111" />
              <path
                d="M17.5 13.7c.75 1.15 1.7 1.7 2.7 1.7s1.95-.55 2.7-1.7"
                fill="none"
                stroke="#111111"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
              <text
                x="30.2"
                y="15.1"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="700"
                fontSize="12.5"
                textAnchor="middle"
                fill="#ffffff"
              >
                e
              </text>
            </svg>
            <span>
              {summary
                ? `${summary.totalPatients} patients · ${summary.totalTests} active lab panels`
                : 'Patient & sample lifecycle management'}
            </span>
          </div>
        </footer>
      </div>

      {toasts.length > 0 ? (
        <div
          className="fixed right-5 bottom-5 z-[120] flex max-w-sm flex-col gap-2"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`glass-panel flex items-center justify-between gap-3 px-4 py-3 text-xs shadow-lg ${
                toast.type === 'error' ? 'border-red-400/50 text-red-100' : 'border-white/30 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-300" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                )}
                <span>{toast.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5 text-[#9a9a9a] hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
