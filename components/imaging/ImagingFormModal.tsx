'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface PatientOption { _id: string; firstName: string; lastName: string; patientId: string; }
interface HospitalOption { _id: string; name: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: Record<string, unknown> | null;
}

export default function ImagingFormModal({ open, onClose, onSaved, editData }: Props) {
  const [patient, setPatient] = useState('');
  const [type, setType] = useState('xray');
  const [bodyPart, setBodyPart] = useState('');
  const [notes, setNotes] = useState('');
  const [report, setReport] = useState('');
  const [status, setStatus] = useState('requested');
  const [hospital, setHospital] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [imagingTypes, setImagingTypes] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/patients?limit=200').then(r => r.json()).then(j => { if (j.success) setPatients(j.data); });
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: HospitalOption & { isActive: boolean }) => h.isActive));
    });
    // Fetch imaging types from system config
    fetch('/api/settings/config?key=imagingTypes').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        // Convert string array to value/label format
        const types = (j.data.values || []).map((label: string) => ({
          value: label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          label: label
        }));
        setImagingTypes(types);
        // Set default type if not already set
        if (types.length > 0 && !type) setType(types[0].value);
      }
    }).catch(() => {
      // Fallback to default types if config not available
      setImagingTypes([
        { value: 'xray', label: 'X-Ray' },
        { value: 'ultrasound', label: 'Ultrasound' },
        { value: 'ct', label: 'CT Scan' },
        { value: 'mri', label: 'MRI' },
        { value: 'echocardiography', label: 'Echocardiography' },
        { value: 'mammography', label: 'Mammography' },
        { value: 'pet-scan', label: 'PET Scan' },
        { value: 'other', label: 'Other' },
      ]);
    });
  }, [open]);

  useEffect(() => {
    if (editData) {
      const pat = editData.patient;
      const hosp = editData.hospital;
      setPatient(typeof pat === 'object' && pat !== null ? (pat as PatientOption)._id : String(pat || ''));
      setType(String(editData.type || 'xray'));
      setBodyPart(String(editData.bodyPart || ''));
      setNotes(String(editData.notes || ''));
      setReport(String(editData.report || ''));
      setStatus(String(editData.status || 'requested'));
      setHospital(typeof hosp === 'object' && hosp !== null ? (hosp as HospitalOption)._id : String(hosp || ''));
    } else {
      setPatient(''); setType('xray'); setBodyPart(''); setNotes(''); setReport(''); setStatus('requested'); setHospital('');
    }
    setError('');
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !type) { setError('Patient and type are required.'); return; }
    setSaving(true); setError('');

    const url = editData ? `/api/imaging/${editData._id}` : '/api/imaging';
    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient, type, bodyPart, notes, report, hospital, ...(editData ? { status } : {}) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <Modal title={editData ? 'Edit Imaging Study' : 'New Imaging Request'} onClose={onClose}>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Patient *</label>
          <select className={styles.formSelect} value={patient} onChange={(e) => setPatient(e.target.value)} required>
            <option value="">Select patient...</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hospital</label>
          <select className={styles.formSelect} value={hospital} onChange={(e) => setHospital(e.target.value)}>
            <option value="">No hospital (centralized)</option>
            {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Type *</label>
            <select className={styles.formSelect} value={type} onChange={(e) => setType(e.target.value)} required>
              {imagingTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Body Part</label>
            <input className={styles.formInput} value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} placeholder="e.g., Chest, Brain, Heart..." />
          </div>
        </div>
        {editData && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="requested">Requested</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Report</label>
          <textarea className={styles.formTextarea} value={report} onChange={(e) => setReport(e.target.value)} placeholder="Imaging report / findings..." rows={4} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update' : 'Create Request'}</Button>
        </div>
      </form>
    </Modal>
  );
}
