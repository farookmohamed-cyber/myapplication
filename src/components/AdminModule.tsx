import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Lock, LogOut, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { isDemoMode, labApi } from '../api/labApi';
import type { AdminSession, DashboardSummary, LabEvent, LaboratoryStaff } from '../types/lab';

interface Props {
  session: AdminSession | null;
  summary: DashboardSummary | null;
  onLoginSuccess: (session: AdminSession) => void;
  onLogout: () => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onNavigateTests: () => void;
}

const EMPTY_STAFF = {
  fullName: '',
  role: 'Clinical Laboratory Technician',
  department: 'Hematology & Serology',
  qualification: 'BSc Medical Laboratory Technology',
  email: '',
  phone: '',
  active: true,
};

export default function AdminModule({
  session,
  summary,
  onLoginSuccess,
  onLogout,
  onNotify,
  onNavigateTests,
}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [staff, setStaff] = useState<LaboratoryStaff[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_STAFF);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [staffList, eventList] = await Promise.all([labApi.getStaff(), labApi.getEvents()]);
      setStaff(staffList);
      setEvents(eventList);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.authenticated) {
      loadAdminData();
    }
  }, [session?.authenticated]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      onNotify('error', 'Enter your administrator username and password.');
      return;
    }
    setLoggingIn(true);
    try {
      const res = await labApi.adminLogin(username.trim(), password);
      onLoginSuccess(res);
      setPassword('');
      onNotify('success', `Signed in as ${res.username} (${res.role}).`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Invalid administrator credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_STAFF);
    setShowForm(true);
  };

  const openEdit = (st: LaboratoryStaff) => {
    setEditingId(st.id);
    setForm({
      fullName: st.fullName,
      role: st.role,
      department: st.department,
      qualification: st.qualification,
      email: st.email,
      phone: st.phone,
      active: st.active,
    });
    setShowForm(true);
  };

  const handleSaveStaff = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId !== null) {
        await labApi.updateStaff(editingId, form);
        onNotify('success', 'Laboratory staff profile updated.');
      } else {
        const created = await labApi.createStaff(form);
        onNotify('success', `Added staff member ${created.fullName} (${created.staffCode}).`);
      }
      setShowForm(false);
      await loadAdminData();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (st: LaboratoryStaff) => {
    setSaving(true);
    try {
      await labApi.deleteStaff(st.id);
      onNotify('success', `Removed staff member ${st.fullName}.`);
      await loadAdminData();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to delete staff member');
    } finally {
      setSaving(false);
    }
  };

  if (!session?.authenticated) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-8">
        <form onSubmit={handleLogin} className="glass-panel flex flex-col gap-4 p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Lock className="h-5 w-5 text-white" />
            <div>
              <h2 className="text-xl font-medium text-white">
                Admin <span className="serif-italic">Console</span> Login
              </h2>
              <p className="text-xs text-[#9a9a9a]">
                {isDemoMode()
                  ? 'Temporary Demonstration Mode: enter any username and passphrase (4+ chars) to preview admin tools.'
                  : 'Authenticate via your Java Spring Boot REST API server credentials.'}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Administrator Username</label>
            <input
              required
              className="lab-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-[#9a9a9a]">Password</label>
            <input
              required
              type="password"
              className="lab-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
            />
          </div>

          <button type="submit" className="btn btn-solid mt-2 w-full" disabled={loggingIn}>
            {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Sign In to Admin Console
          </button>

          <p className="text-center text-xs text-[#9a9a9a]">
            {isDemoMode()
              ? 'Demonstration session runs locally in your browser; no administrator passwords are stored or hardcoded in frontend code.'
              : 'Credentials are verified server-side via environment variables on the backend.'}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Administration & <span className="serif-italic">Staff</span> Management
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Signed in as <strong className="text-white">{session.username}</strong> ({session.role})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-ghost" onClick={onNavigateTests}>
            Test Category Manager
          </button>
          <button type="button" className="btn btn-solid" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Staff Member
          </button>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleSaveStaff} className="glass-panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-medium text-white">
              {editingId !== null ? 'Edit Laboratory Staff' : 'Add Laboratory Staff'}
            </h3>
            <button type="button" className="module-pill" onClick={() => setShowForm(false)}>
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Full Name *</label>
              <input
                required
                className="lab-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Role *</label>
              <input
                required
                className="lab-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Department *</label>
              <input
                required
                className="lab-input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Qualification *</label>
              <input
                required
                className="lab-input"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Email *</label>
              <input
                required
                type="email"
                className="lab-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Phone *</label>
              <input
                required
                className="lab-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-solid" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Staff Profile
            </button>
          </div>
        </form>
      ) : null}

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3.5">
          <h3 className="text-sm font-medium text-white">Authorized Laboratory Staff ({staff.length})</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading staff directory...
          </div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Qualification</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((st) => (
                  <tr key={st.id}>
                    <td className="font-medium text-white tabular-nums">{st.staffCode}</td>
                    <td>{st.fullName}</td>
                    <td>{st.role}</td>
                    <td className="text-[#d8d8d8]">{st.department}</td>
                    <td className="text-xs text-[#9a9a9a]">{st.qualification}</td>
                    <td className="text-xs">
                      <div>{st.email}</div>
                      <div className="text-[#9a9a9a]">{st.phone}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button type="button" className="module-pill" onClick={() => openEdit(st)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="module-pill"
                          disabled={saving}
                          onClick={() => handleDeleteStaff(st)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="mb-3 text-sm font-medium text-white">Dashboard Monitoring Snapshot</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="glass-panel-soft p-3">
              <span className="block text-[#9a9a9a]">Patients Registered</span>
              <span className="mt-1 block text-xl font-semibold text-white tabular-nums">
                {summary?.totalPatients ?? 0}
              </span>
            </div>
            <div className="glass-panel-soft p-3">
              <span className="block text-[#9a9a9a]">Pending Samples</span>
              <span className="mt-1 block text-xl font-semibold text-white tabular-nums">
                {summary?.pendingSamples ?? 0}
              </span>
            </div>
            <div className="glass-panel-soft p-3">
              <span className="block text-[#9a9a9a]">Completed Tests</span>
              <span className="mt-1 block text-xl font-semibold text-white tabular-nums">
                {summary?.completedTests ?? 0}
              </span>
            </div>
            <div className="glass-panel-soft p-3">
              <span className="block text-[#9a9a9a]">Stored PDF Reports</span>
              <span className="mt-1 block text-xl font-semibold text-white tabular-nums">
                {summary?.totalReports ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-3 text-sm font-medium text-white">
            {isDemoMode() ? 'Demonstration Event Log' : 'Java Event Listener Audit Stream'}
          </h3>
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {events.map((evt) => (
              <div key={evt.eventId} className="glass-panel-soft flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <div>
                  <span className="font-medium text-white">{evt.type}</span>{' '}
                  <span className="text-[#9a9a9a]">· {evt.message}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#9a9a9a] tabular-nums">
                  {evt.timestamp.replace('T', ' ').slice(11, 19)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
