'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface RecordFormData {
  patient: string;
  type: string;
  hospital: string;
  content: {
    chiefComplaint: string;
    examination: string;
    diagnosis: string;
    treatmentPlan: string;
    vitals: { bloodPressure: string; heartRate: string; temperature: string; weight: string; height: string };
    prescriptions: { medication: string; dosage: string; frequency: string; duration: string }[];
    notes: string;
  };
}

const emptyForm: RecordFormData = {
  patient: '',
  type: 'consultation',
  hospital: '',
  content: {
    chiefComplaint: '', examination: '', diagnosis: '', treatmentPlan: '',
    vitals: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
    prescriptions: [],
    notes: '',
  },
};

interface PatientOption { _id: string; firstName: string; lastName: string; patientId: string; }
interface HospitalOption { _id: string; name: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: Record<string, unknown> | null;
}

export default function RecordFormModal({ open, onClose, onSaved, editData }: Props) {
  const [form, setForm] = useState<RecordFormData>(emptyForm);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
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
  }, [open]);

  useEffect(() => {
    if (editData) {
      const c = (editData.content || {}) as Record<string, unknown>;
      const v = (c.vitals || {}) as Record<string, string>;
      const presc = (c.prescriptions || []) as { medication: string; dosage: string; frequency: string; duration: string }[];
      const pat = editData.patient;
      const hosp = editData.hospital;
      setForm({
        patient: typeof pat === 'object' && pat !== null ? (pat as PatientOption)._id : String(pat || ''),
        type: String(editData.type || 'consultation'),
        hospital: typeof hosp === 'object' && hosp !== null ? (hosp as HospitalOption)._id : String(hosp || ''),
        content: {
          chiefComplaint: String(c.chiefComplaint || ''),
          examination: String(c.examination || ''),
          diagnosis: String(c.diagnosis || ''),
          treatmentPlan: String(c.treatmentPlan || ''),
          vitals: {
            bloodPressure: v.bloodPressure || '', heartRate: v.heartRate || '',
            temperature: v.temperature || '', weight: v.weight || '', height: v.height || '',
          },
          prescriptions: presc,
          notes: String(c.notes || ''),
        },
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editData, open]);

  const setContent = (field: string, value: string) => {
    setForm(prev => ({ ...prev, content: { ...prev.content, [field]: value } }));
  };

  const setVital = (field: string, value: string) => {
    setForm(prev => ({ ...prev, content: { ...prev.content, vitals: { ...prev.content.vitals, [field]: value } } }));
  };

  const addPrescription = () => {
    setForm(prev => ({
      ...prev,
      content: {
        ...prev.content,
        prescriptions: [...prev.content.prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }],
      },
    }));
  };

  const updatePrescription = (idx: number, field: string, value: string) => {
    setForm(prev => {
      const presc = [...prev.content.prescriptions];
      presc[idx] = { ...presc[idx], [field]: value };
      return { ...prev, content: { ...prev.content, prescriptions: presc } };
    });
  };

  const removePrescription = (idx: number) => {
    setForm(prev => ({
      ...prev,
      content: { ...prev.content, prescriptions: prev.content.prescriptions.filter((_, i) => i !== idx) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.type) { setError('Patient and type are required.'); return; }
    setSaving(true);
    setError('');

    const url = editData ? `/api/records/${(editData as Record<string, unknown>)._id}` : '/api/records';
    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to save');
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
    <Modal title={editData ? 'Edit Medical Record' : 'New Medical Record'} onClose={onClose}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient *</label>
            <select className={styles.formSelect} value={form.patient} onChange={(e) => setForm(p => ({ ...p, patient: e.target.value }))} required>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Type *</label>
            <select className={styles.formSelect} value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} required>
              <option value="consultation">Consultation</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="treatment">Treatment</option>
              <option value="vitals">Vitals</option>
              <option value="prescription">Prescription</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hospital</label>
          <select className={styles.formSelect} value={form.hospital} onChange={(e) => setForm(p => ({ ...p, hospital: e.target.value }))}>
            <option value="">No hospital (centralized)</option>
            {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Chief Complaint</label>
          <textarea className={styles.formTextarea} value={form.content.chiefComplaint} onChange={(e) => setContent('chiefComplaint', e.target.value)} placeholder="Patient's main complaint..." />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Examination</label>
          <textarea className={styles.formTextarea} value={form.content.examination} onChange={(e) => setContent('examination', e.target.value)} placeholder="Physical examination findings..." />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Diagnosis</label>
          <textarea className={styles.formTextarea} value={form.content.diagnosis} onChange={(e) => setContent('diagnosis', e.target.value)} placeholder="Diagnosis..." />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Treatment Plan</label>
          <textarea className={styles.formTextarea} value={form.content.treatmentPlan} onChange={(e) => setContent('treatmentPlan', e.target.value)} placeholder="Treatment plan..." />
        </div>

        {/* Vitals */}
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>Vitals</div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label className={styles.formLabel}>Blood Pressure</label><input className={styles.formInput} value={form.content.vitals.bloodPressure} onChange={(e) => setVital('bloodPressure', e.target.value)} placeholder="e.g., 120/80" /></div>
          <div className={styles.formGroup}><label className={styles.formLabel}>Heart Rate</label><input className={styles.formInput} value={form.content.vitals.heartRate} onChange={(e) => setVital('heartRate', e.target.value)} placeholder="e.g., 72 bpm" /></div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label className={styles.formLabel}>Temperature</label><input className={styles.formInput} value={form.content.vitals.temperature} onChange={(e) => setVital('temperature', e.target.value)} placeholder="e.g., 37.0°C" /></div>
          <div className={styles.formGroup}><label className={styles.formLabel}>Weight</label><input className={styles.formInput} value={form.content.vitals.weight} onChange={(e) => setVital('weight', e.target.value)} placeholder="e.g., 70 kg" /></div>
        </div>
        <div className={styles.formGroup}><label className={styles.formLabel}>Height</label><input className={styles.formInput} value={form.content.vitals.height} onChange={(e) => setVital('height', e.target.value)} placeholder="e.g., 175 cm" /></div>

        {/* Prescriptions */}
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Prescriptions</span>
          <button type="button" onClick={addPrescription} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>+ Add</button>
        </div>
        {form.content.prescriptions.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
            <input className={styles.formInput} value={p.medication} onChange={(e) => updatePrescription(i, 'medication', e.target.value)} placeholder="Medication" />
            <input className={styles.formInput} value={p.dosage} onChange={(e) => updatePrescription(i, 'dosage', e.target.value)} placeholder="Dosage" />
            <input className={styles.formInput} value={p.frequency} onChange={(e) => updatePrescription(i, 'frequency', e.target.value)} placeholder="Frequency" />
            <input className={styles.formInput} value={p.duration} onChange={(e) => updatePrescription(i, 'duration', e.target.value)} placeholder="Duration" />
            <button type="button" onClick={() => removePrescription(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '14px' }}>×</button>
          </div>
        ))}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={form.content.notes} onChange={(e) => setContent('notes', e.target.value)} placeholder="Additional notes..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update Record' : 'Create Record'}</Button>
        </div>
      </form>
    </Modal>
  );
}
