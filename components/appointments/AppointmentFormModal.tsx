'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface IntakeQuestion { question: string; answer: string; }

interface AppointmentFormData {
  patient: string;
  doctor: string;
  department: string;
  dateTime: string;
  duration: number;
  reason: string;
  status: string;
  notes: string;
  hospital: string;
  intake: {
    vitals: { weight: string; bloodPressure: string };
    questions: IntakeQuestion[];
  };
}

const defaultQuestions: IntakeQuestion[] = [
  { question: 'Do you have any allergies?', answer: '' },
  { question: 'Are you currently on any medication?', answer: '' },
  { question: 'Have you had any recent surgeries?', answer: '' },
];

const emptyForm: AppointmentFormData = {
  patient: '', doctor: '', department: '', dateTime: '',
  duration: 30, reason: '', status: 'scheduled', notes: '', hospital: '',
  intake: { vitals: { weight: '', bloodPressure: '' }, questions: [...defaultQuestions] },
};

const departments = [
  'Cardiology', 'Gynecology', 'Pediatrics', 'Neurology', 'Surgery',
  'Ophthalmology', 'Dermatology', 'Emergency', 'General Medicine', 'Orthopedics',
];

const statuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-preparation', label: 'In Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
];

interface PatientOption { _id: string; firstName: string; lastName: string; patientId: string; }
interface DoctorOption { _id: string; firstName: string; lastName: string; }
interface HospitalOption { _id: string; name: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: (AppointmentFormData & { _id: string }) | null;
}

export default function AppointmentFormModal({ open, onClose, onSaved, editData }: Props) {
  const [form, setForm] = useState<AppointmentFormData>(emptyForm);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickPatient, setQuickPatient] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', phone: '' });
  const [registeringPatient, setRegisteringPatient] = useState(false);

  const handleQuickRegister = async () => {
    if (!quickPatient.firstName || !quickPatient.lastName || !quickPatient.dateOfBirth) {
      setError('First name, last name, and date of birth are required.');
      return;
    }
    setRegisteringPatient(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickPatient),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      // Add to patients list and select
      setPatients(prev => [...prev, json.data]);
      set('patient', json.data._id);
      setShowQuickRegister(false);
      setQuickPatient({ firstName: '', lastName: '', dateOfBirth: '', gender: 'male', phone: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient');
    } finally {
      setRegisteringPatient(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setShowQuickRegister(false);
    // Fetch patients and doctors for dropdowns
    fetch('/api/patients?limit=200').then(r => r.json()).then(j => {
      if (j.success) setPatients(j.data);
    });
    fetch('/api/settings/users?role=doctor&limit=50').then(r => r.json()).then(j => {
      if (j.success) setDoctors(j.data);
    }).catch(() => {
      // Users API may not exist yet, use empty
    });
    fetch('/api/settings/hospitals?limit=100').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: HospitalOption & { isActive: boolean }) => h.isActive));
    }).catch(() => {
      // Hospitals API may not exist yet, use empty
    });
  }, [open]);

  useEffect(() => {
    if (editData) {
      setForm({
        patient: typeof editData.patient === 'object' ? (editData.patient as unknown as PatientOption)._id : editData.patient,
        doctor: typeof editData.doctor === 'object' ? (editData.doctor as unknown as DoctorOption)._id : editData.doctor,
        department: editData.department,
        dateTime: editData.dateTime?.slice(0, 16) || '',
        duration: editData.duration || 30,
        reason: editData.reason || '',
        status: editData.status || 'scheduled',
        notes: editData.notes || '',
        hospital: typeof editData.hospital === 'object' ? (editData.hospital as unknown as HospitalOption)?._id || '' : editData.hospital || '',
        intake: editData.intake && editData.intake.vitals ? editData.intake : { vitals: { weight: '', bloodPressure: '' }, questions: [...defaultQuestions] },
      });
    } else {
      setForm({ ...emptyForm, intake: { vitals: { weight: '', bloodPressure: '' }, questions: [...defaultQuestions] } });
    }
    setError('');
  }, [editData, open]);

  const set = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.department || !form.dateTime) {
      setError('Patient, department, and date/time are required.');
      return;
    }
    setSaving(true);
    setError('');

    const url = editData ? `/api/appointments/${editData._id}` : '/api/appointments';
    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          doctor: form.doctor || undefined,
        }),
      });
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
    <Modal title={editData ? 'Edit Appointment' : 'New Appointment'} onClose={onClose}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={styles.formLabel}>Patient *</label>
            {!showQuickRegister && !editData && (
              <button type="button" onClick={() => setShowQuickRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>
                + New Patient
              </button>
            )}
          </div>
          {showQuickRegister ? (
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Quick Patient Registration</span>
                <button type="button" onClick={() => setShowQuickRegister(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input className={styles.formInput} placeholder="First name *" value={quickPatient.firstName} onChange={(e) => setQuickPatient(p => ({ ...p, firstName: e.target.value }))} />
                <input className={styles.formInput} placeholder="Last name *" value={quickPatient.lastName} onChange={(e) => setQuickPatient(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input className={styles.formInput} type="date" value={quickPatient.dateOfBirth} onChange={(e) => setQuickPatient(p => ({ ...p, dateOfBirth: e.target.value }))} title="Date of birth *" />
                <select className={styles.formSelect} value={quickPatient.gender} onChange={(e) => setQuickPatient(p => ({ ...p, gender: e.target.value }))}>
                  <option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
              <input className={styles.formInput} placeholder="Phone" value={quickPatient.phone} onChange={(e) => setQuickPatient(p => ({ ...p, phone: e.target.value }))} style={{ marginBottom: '8px' }} />
              <button type="button" onClick={handleQuickRegister} disabled={registeringPatient}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 14px', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'var(--font)', width: '100%' }}>
                {registeringPatient ? 'Registering...' : 'Register & Select'}
              </button>
            </div>
          ) : (
            <select className={styles.formSelect} value={form.patient} onChange={(e) => set('patient', e.target.value)} required>
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Department *</label>
            <select className={styles.formSelect} value={form.department} onChange={(e) => set('department', e.target.value)} required>
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Doctor</label>
            <select className={styles.formSelect} value={form.doctor} onChange={(e) => set('doctor', e.target.value)}>
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hospital</label>
          <select className={styles.formSelect} value={form.hospital} onChange={(e) => set('hospital', e.target.value)}>
            <option value="">No hospital (centralized)</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date & Time *</label>
            <input className={styles.formInput} type="datetime-local" value={form.dateTime} onChange={(e) => set('dateTime', e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Duration (min)</label>
            <input className={styles.formInput} type="number" min="5" max="480" value={form.duration} onChange={(e) => set('duration', parseInt(e.target.value) || 30)} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason</label>
          <input className={styles.formInput} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g., Follow-up, Check-up..." />
        </div>

        {editData && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select className={styles.formSelect} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Intake / Triage (Reception Phase) ── */}
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          Initial Consultation — Vitals
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Weight (kg)</label>
            <input className={styles.formInput} value={form.intake?.vitals?.weight || ''} onChange={(e) => setForm(prev => ({ ...prev, intake: { ...prev.intake, vitals: { ...prev.intake.vitals, weight: e.target.value } } }))} placeholder="e.g., 70" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Blood Pressure</label>
            <input className={styles.formInput} value={form.intake?.vitals?.bloodPressure || ''} onChange={(e) => setForm(prev => ({ ...prev, intake: { ...prev.intake, vitals: { ...prev.intake.vitals, bloodPressure: e.target.value } } }))} placeholder="e.g., 120/80" />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '12px 0 8px' }}>
          Screening Questions
        </div>
        {(form.intake?.questions || []).map((q, i) => (
          <div key={i} className={styles.formGroup}>
            <label className={styles.formLabel}>{q.question}</label>
            <input className={styles.formInput} value={q.answer} onChange={(e) => {
              setForm(prev => {
                const questions = [...(prev.intake?.questions || [])];
                questions[i] = { ...questions[i], answer: e.target.value };
                return { ...prev, intake: { ...prev.intake, questions } };
              });
            }} placeholder="Answer..." />
          </div>
        ))}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional notes..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update' : 'Create Appointment'}</Button>
        </div>
      </form>
    </Modal>
  );
}
