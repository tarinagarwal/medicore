'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  category: string;
  hospital: string;
  address: { street: string; city: string; region: string; postalCode: string };
  insuranceInfo: { provider: string; policyNumber: string };
  emergencyContact: { name: string; phone: string; relationship: string };
}

const emptyForm: PatientFormData = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'male',
  phone: '', email: '', category: 'outpatient', hospital: '',
  address: { street: '', city: '', region: '', postalCode: '' },
  insuranceInfo: { provider: '', policyNumber: '' },
  emergencyContact: { name: '', phone: '', relationship: '' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: (PatientFormData & { _id: string }) | null;
}

export default function PatientFormModal({ open, onClose, onSaved, editData }: Props) {
  const [form, setForm] = useState<PatientFormData>(emptyForm);
  const [hospitals, setHospitals] = useState<Array<{ _id: string; name: string; isActive: boolean }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    // Fetch hospitals
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: { isActive: boolean }) => h.isActive));
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (editData) {
      setForm({
        firstName: editData.firstName,
        lastName: editData.lastName,
        dateOfBirth: editData.dateOfBirth?.slice(0, 10) || '',
        gender: editData.gender,
        phone: editData.phone,
        email: editData.email,
        category: editData.category,
        hospital: typeof editData.hospital === 'object' ? (editData.hospital as { _id: string })?._id || '' : editData.hospital || '',
        address: editData.address || emptyForm.address,
        insuranceInfo: editData.insuranceInfo || emptyForm.insuranceInfo,
        emergencyContact: editData.emergencyContact || emptyForm.emergencyContact,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editData, open]);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setNested = (group: 'address' | 'insuranceInfo' | 'emergencyContact', field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dateOfBirth) {
      setError('First name, last name, and date of birth are required.');
      return;
    }
    setSaving(true);
    setError('');

    const url = editData ? `/api/patients/${editData._id}` : '/api/patients';
    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <Modal title={editData ? 'Edit Patient' : 'New Patient'} onClose={onClose}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>First Name *</label>
            <input className={styles.formInput} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Name *</label>
            <input className={styles.formInput} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date of Birth *</label>
            <input className={styles.formInput} type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Gender</label>
            <select className={styles.formSelect} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone</label>
            <input className={styles.formInput} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Category</label>
          <select className={styles.formSelect} value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="outpatient">Outpatient</option>
            <option value="hospitalized">Hospitalized</option>
            <option value="external">External</option>
            <option value="emergency">Emergency</option>
          </select>
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

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          Address
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Street</label>
            <input className={styles.formInput} value={form.address.street} onChange={(e) => setNested('address', 'street', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>City</label>
            <input className={styles.formInput} value={form.address.city} onChange={(e) => setNested('address', 'city', e.target.value)} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Region</label>
            <input className={styles.formInput} value={form.address.region} onChange={(e) => setNested('address', 'region', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Postal Code</label>
            <input className={styles.formInput} value={form.address.postalCode} onChange={(e) => setNested('address', 'postalCode', e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          Insurance
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Provider</label>
            <input className={styles.formInput} value={form.insuranceInfo.provider} onChange={(e) => setNested('insuranceInfo', 'provider', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Policy Number</label>
            <input className={styles.formInput} value={form.insuranceInfo.policyNumber} onChange={(e) => setNested('insuranceInfo', 'policyNumber', e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          Emergency Contact
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Name</label>
            <input className={styles.formInput} value={form.emergencyContact.name} onChange={(e) => setNested('emergencyContact', 'name', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone</label>
            <input className={styles.formInput} value={form.emergencyContact.phone} onChange={(e) => setNested('emergencyContact', 'phone', e.target.value)} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Relationship</label>
          <input className={styles.formInput} value={form.emergencyContact.relationship} onChange={(e) => setNested('emergencyContact', 'relationship', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update Patient' : 'Create Patient'}</Button>
        </div>
      </form>
    </Modal>
  );
}
