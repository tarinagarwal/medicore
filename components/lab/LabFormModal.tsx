'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface LabFormData {
  patient: string;
  hospital: string;
  tests: { name: string; category: string }[];
  notes: string;
}

const emptyForm: LabFormData = { patient: '', hospital: '', tests: [{ name: '', category: '' }], notes: '' };

interface PatientOption { _id: string; firstName: string; lastName: string; patientId: string; }
interface HospitalOption { _id: string; name: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function LabFormModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState<LabFormData>(emptyForm);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [testCategories, setTestCategories] = useState<string[]>([]);
  const [labTests, setLabTests] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/patients?limit=200').then(r => r.json()).then(j => {
      if (j.success) setPatients(j.data);
    });
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: HospitalOption & { isActive: boolean }) => h.isActive));
    });
    // Fetch lab categories from system config
    fetch('/api/settings/config?key=labCategories').then(r => r.json()).then(j => {
      if (j.success && j.data) setTestCategories(j.data.values || []);
    }).catch(() => {
      // Fallback to default categories if config not available
      setTestCategories(['Hematology', 'Biochemistry', 'Endocrinology', 'Microbiology', 'Immunology', 'Urinalysis', 'Serology', 'Toxicology', 'Genetics']);
    });
    // Fetch lab tests from system config
    fetch('/api/settings/config?key=labTests').then(r => r.json()).then(j => {
      if (j.success && j.data) setLabTests(j.data.values || {});
    }).catch(() => {
      // Fallback to default tests if config not available
      setLabTests({
        Hematology: ['NFS (CBC)', 'ESR', 'Blood Group', 'Coagulation'],
        Biochemistry: ['CRP', 'Glucose', 'Creatinine', 'Urea', 'Lipid Panel', 'Liver Panel'],
        Endocrinology: ['TSH', 'T3', 'T4', 'HbA1c', 'Cortisol'],
        Microbiology: ['Blood Culture', 'Urine Culture', 'Stool Culture'],
        Immunology: ['HIV', 'Hepatitis B', 'Hepatitis C', 'ANA'],
        Urinalysis: ['Urinalysis', 'Urine Protein'],
        Serology: ['RPR', 'VDRL', 'Widal Test'],
        Toxicology: ['Drug Screen', 'Alcohol Level'],
        Genetics: ['Karyotype', 'DNA Test'],
      });
    });
    setForm(emptyForm);
    setError('');
  }, [open]);

  const addTest = () => {
    setForm(prev => ({ ...prev, tests: [...prev.tests, { name: '', category: '' }] }));
  };

  const updateTest = (idx: number, field: 'name' | 'category', value: string) => {
    setForm(prev => {
      const tests = [...prev.tests];
      tests[idx] = { ...tests[idx], [field]: value };
      return { ...prev, tests };
    });
  };

  const removeTest = (idx: number) => {
    setForm(prev => ({ ...prev, tests: prev.tests.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTests = form.tests.filter(t => t.name.trim());
    if (!form.patient || validTests.length === 0) {
      setError('Patient and at least one test are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tests: validTests }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal title="New Lab Request" onClose={onClose}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Patient *</label>
          <select className={styles.formSelect} value={form.patient} onChange={(e) => setForm(p => ({ ...p, patient: e.target.value }))} required>
            <option value="">Select patient...</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hospital</label>
          <select className={styles.formSelect} value={form.hospital} onChange={(e) => setForm(p => ({ ...p, hospital: e.target.value }))}>
            <option value="">No hospital (centralized)</option>
            {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tests *</span>
          <button type="button" onClick={addTest} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>+ Add Test</button>
        </div>

        {form.tests.map((test, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
            <select className={styles.formSelect} value={test.category} onChange={(e) => updateTest(i, 'category', e.target.value)}>
              <option value="">Category...</option>
              {testCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {test.category && labTests[test.category] && labTests[test.category].length > 0 ? (
              <select className={styles.formSelect} value={test.name} onChange={(e) => updateTest(i, 'name', e.target.value)}>
                <option value="">Select test...</option>
                {labTests[test.category].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input 
                className={styles.formInput} 
                value={test.name} 
                onChange={(e) => updateTest(i, 'name', e.target.value)}
                placeholder={test.category ? "Enter test name..." : "Select category first..."}
                disabled={!test.category}
              />
            )}
            {form.tests.length > 1 && (
              <button type="button" onClick={() => removeTest(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>×</button>
            )}
          </div>
        ))}

        <div className={styles.formGroup} style={{ marginTop: '12px' }}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Special instructions..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Lab Request'}</Button>
        </div>
      </form>
    </Modal>
  );
}
