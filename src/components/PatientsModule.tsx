import { useEffect, useState, type FormEvent } from 'react';
import { Eye, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { labApi } from '../api/labApi';
import type { Gender, Patient } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
}

const EMPTY_FORM = {
  fullName: '',
  age: '',
  gender: 'MALE' as Gender,
  phoneNumber: '',
  email: '',
  address: '',
  registrationDate: new Date().toISOString().slice(0, 10),
};

export default function PatientsModule({ onNotify, onDataChanged }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewing, setViewing] = useState<Patient | null>(null);

  const loadPatients = async (query = search) => {
    setLoading(true);
    try {
      const data = await labApi.getPatients(query);
      setPatients(data);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients('');
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, registrationDate: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const openEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({
      fullName: p.fullName,
      age: String(p.age),
      gender: p.gender,
      phoneNumber: p.phoneNumber,
      email: p.email,
      address: p.address,
      registrationDate: p.registrationDate,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ageNum = Number(form.age);
    if (!form.fullName.trim() || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      onNotify('error', 'Please enter a valid full name and age between 0 and 130.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        age: ageNum,
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        registrationDate: form.registrationDate,
      };
      if (editingId !== null) {
        await labApi.updatePatient(editingId, payload);
        onNotify('success', 'Patient record updated successfully.');
      } else {
        const created = await labApi.createPatient(payload);
        onNotify('success', `Patient registered with ID ${created.patientCode}.`);
      }
      setShowForm(false);
      await loadPatients();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save patient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Patient) => {
    setSaving(true);
    try {
      await labApi.deletePatient(p.id);
      onNotify('success', `Deleted patient ${p.fullName} (${p.patientCode}).`);
      if (viewing?.id === p.id) setViewing(null);
      await loadPatients();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to delete patient');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadPatients(search);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Patient <span className="serif-italic">Management</span>
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Register, edit, view, search, and maintain patient demographics in the laboratory registry.
          </p>
        </div>
        <button type="button" className="btn btn-solid" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
          <input
            type="text"
            className="lab-input pl-9"
            placeholder="Search by Patient ID, full name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-ghost">
          Search
        </button>
        {search ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              loadPatients('');
            }}
          >
            Reset
          </button>
        ) : null}
      </form>

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-medium text-white">
              {editingId !== null ? 'Edit Patient Record' : 'Register New Patient'}
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
                placeholder="e.g. Rohan Mehta"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Age *</label>
              <input
                required
                type="number"
                min={0}
                max={130}
                className="lab-input"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="34"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Gender *</label>
              <select
                className="lab-select"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Phone Number *</label>
              <input
                required
                className="lab-input"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+1-555-0199"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Email Address *</label>
              <input
                required
                type="email"
                className="lab-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@example.org"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Registration Date *</label>
              <input
                required
                type="date"
                className="lab-input"
                value={form.registrationDate}
                onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Residential Address *</label>
              <input
                required
                className="lab-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, Apartment, City"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-solid" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId !== null ? 'Update Patient' : 'Save Patient'}
            </button>
          </div>
        </form>
      ) : null}

      {viewing ? (
        <div className="glass-panel flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-xs text-[#9a9a9a]">{viewing.patientCode}</span>
              <h3 className="text-lg font-medium text-white">{viewing.fullName}</h3>
            </div>
            <button type="button" className="module-pill" onClick={() => setViewing(null)}>
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-xs text-[#9a9a9a]">Age & Gender</span>
              <span>
                {viewing.age} yrs · {viewing.gender}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Phone</span>
              <span>{viewing.phoneNumber}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Email</span>
              <span>{viewing.email}</span>
            </div>
            <div>
              <span className="block text-xs text-[#9a9a9a]">Registration Date</span>
              <span>{viewing.registrationDate}</span>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <span className="block text-xs text-[#9a9a9a]">Address</span>
              <span>{viewing.address}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">
            No patients found matching your query.
          </div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Full Name</th>
                  <th>Age / Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Reg. Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-white tabular-nums">{p.patientCode}</td>
                    <td>{p.fullName}</td>
                    <td className="tabular-nums">
                      {p.age} / {p.gender}
                    </td>
                    <td>{p.phoneNumber}</td>
                    <td className="text-[#d8d8d8]">{p.email}</td>
                    <td className="tabular-nums">{p.registrationDate}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="module-pill"
                          onClick={() => setViewing(p)}
                          title="View patient details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="module-pill"
                          onClick={() => openEdit(p)}
                          title="Edit patient"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="module-pill"
                          onClick={() => handleDelete(p)}
                          title="Delete patient"
                          disabled={saving}
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
    </div>
  );
}
