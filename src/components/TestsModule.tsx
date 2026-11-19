import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { labApi } from '../api/labApi';
import type { LaboratoryTest, TestCategory } from '../types/lab';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDataChanged: () => void;
}

const CATEGORIES: Array<{ value: TestCategory; label: string; javaClass: string }> = [
  { value: 'BLOOD_TEST', label: 'Blood Test', javaClass: 'BloodTest' },
  { value: 'URINE_TEST', label: 'Urine Test', javaClass: 'UrineTest' },
  { value: 'BIOCHEMISTRY_TEST', label: 'Biochemistry Test', javaClass: 'BiochemistryTest' },
  { value: 'HEMATOLOGY_TEST', label: 'Hematology Test', javaClass: 'HematologyTest' },
  { value: 'MICROBIOLOGY_TEST', label: 'Microbiology Test', javaClass: 'MicrobiologyTest' },
];

const EMPTY_TEST = {
  category: 'BLOOD_TEST' as TestCategory,
  testName: '',
  price: '35',
  sampleType: 'Whole Blood',
  normalRange: '',
  unit: 'mg/dL',
  processingProcedure: '',
  estimatedMinutes: '30',
};

export default function TestsModule({ onNotify, onDataChanged }: Props) {
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [filterCategory, setFilterCategory] = useState<TestCategory | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_TEST);

  const loadTests = async (cat: TestCategory | 'ALL' = filterCategory) => {
    setLoading(true);
    try {
      const data = await labApi.getTests(cat === 'ALL' ? undefined : cat);
      setTests(data);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load laboratory tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests('ALL');
  }, []);

  const handleFilterChange = (cat: TestCategory | 'ALL') => {
    setFilterCategory(cat);
    loadTests(cat);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_TEST);
    setShowForm(true);
  };

  const openEdit = (t: LaboratoryTest) => {
    setEditingId(t.id);
    setForm({
      category: t.category,
      testName: t.testName,
      price: String(t.price),
      sampleType: t.sampleType,
      normalRange: t.normalRange,
      unit: t.unit,
      processingProcedure: t.processingProcedure,
      estimatedMinutes: String(t.estimatedMinutes),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = Number(form.price);
    if (!form.testName.trim() || Number.isNaN(priceNum) || priceNum <= 0) {
      onNotify('error', 'Enter a valid test name and positive test price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        testName: form.testName.trim(),
        price: priceNum,
        sampleType: form.sampleType.trim(),
        normalRange: form.normalRange.trim(),
        unit: form.unit.trim(),
        processingProcedure: form.processingProcedure.trim(),
        estimatedMinutes: Number(form.estimatedMinutes) || 30,
      };
      if (editingId !== null) {
        await labApi.updateTest(editingId, payload);
        onNotify('success', 'Laboratory test updated successfully.');
      } else {
        const created = await labApi.createTest(payload);
        onNotify('success', `Test ${created.testName} (${created.testCode}) created.`);
      }
      setShowForm(false);
      await loadTests();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save laboratory test');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: LaboratoryTest) => {
    setSaving(true);
    try {
      await labApi.deleteTest(t.id);
      onNotify('success', `Deleted test ${t.testName}.`);
      await loadTests();
      onDataChanged();
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to delete test');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Test Catalog & <span className="serif-italic">Categories</span>
          </h2>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Configure diagnostic tests, pricing, reference ranges, and polymorphic category processing procedures.
          </p>
        </div>
        <button type="button" className="btn btn-solid" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Laboratory Test
        </button>
      </div>

      <div className="module-subnav">
        <button
          type="button"
          className={`module-pill ${filterCategory === 'ALL' ? 'is-active' : ''}`}
          onClick={() => handleFilterChange('ALL')}
        >
          All Categories
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`module-pill ${filterCategory === c.value ? 'is-active' : ''}`}
            onClick={() => handleFilterChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-medium text-white">
              {editingId !== null ? 'Edit Laboratory Test' : 'Add New Laboratory Test'}
            </h3>
            <button type="button" className="module-pill" onClick={() => setShowForm(false)}>
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Test Category (Java Subclass) *</label>
              <select
                className="lab-select"
                value={form.category}
                disabled={editingId !== null}
                onChange={(e) => setForm({ ...form, category: e.target.value as TestCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.javaClass})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Test Name *</label>
              <input
                required
                className="lab-input"
                value={form.testName}
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
                placeholder="e.g. Lipid Profile"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Price (USD) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                className="lab-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Specimen / Sample Type *</label>
              <input
                required
                className="lab-input"
                value={form.sampleType}
                onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Normal Reference Range *</label>
              <input
                required
                className="lab-input"
                value={form.normalRange}
                onChange={(e) => setForm({ ...form, normalRange: e.target.value })}
                placeholder="e.g. 70 - 99"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Measurement Unit *</label>
              <input
                required
                className="lab-input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. mg/dL"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Est. Processing Time (min)</label>
              <input
                type="number"
                min={5}
                className="lab-input"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-[#9a9a9a]">Processing Procedure *</label>
              <input
                required
                className="lab-input"
                value={form.processingProcedure}
                onChange={(e) => setForm({ ...form, processingProcedure: e.target.value })}
                placeholder="Describe step-by-step analyzer procedure"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-solid" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId !== null ? 'Update Test' : 'Save Test'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-[#9a9a9a]">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            Loading laboratory test catalog...
          </div>
        ) : tests.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#9a9a9a]">No tests configured in this category.</div>
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Test Code</th>
                  <th>Test Name</th>
                  <th>Category (Subclass)</th>
                  <th>Specimen</th>
                  <th>Normal Range</th>
                  <th>Price</th>
                  <th>Processing Procedure</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => {
                  const meta = CATEGORIES.find((c) => c.value === t.category);
                  return (
                    <tr key={t.id}>
                      <td className="font-medium text-white tabular-nums">{t.testCode}</td>
                      <td>{t.testName}</td>
                      <td>
                        <span className="status-chip">{meta?.javaClass || t.category}</span>
                      </td>
                      <td className="text-[#d8d8d8]">{t.sampleType}</td>
                      <td className="tabular-nums">
                        {t.normalRange} {t.unit}
                      </td>
                      <td className="tabular-nums">${t.price.toFixed(2)}</td>
                      <td className="max-w-xs text-xs text-[#9a9a9a]">{t.processingProcedure}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button type="button" className="module-pill" onClick={() => openEdit(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="module-pill"
                            onClick={() => handleDelete(t)}
                            disabled={saving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
