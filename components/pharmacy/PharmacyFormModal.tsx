'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

const categories = ['Antibiotics', 'Analgesics', 'Gastroenterology', 'Diabetes', 'Cardiology', 'Dermatology', 'Respiratory', 'Vitamins', 'Other'];

interface HospitalOption { _id: string; name: string; }

interface PharmacyFormData {
  name: string; category: string; quantity: number; unit: string;
  minThreshold: number; supplier: string; expiryDate: string; unitPrice: number; hospital: string;
}

const emptyForm: PharmacyFormData = {
  name: '', category: '', quantity: 0, unit: 'tablets',
  minThreshold: 10, supplier: '', expiryDate: '', unitPrice: 0, hospital: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: Record<string, unknown> | null;
}

export default function PharmacyFormModal({ open, onClose, onSaved, editData }: Props) {
  const [form, setForm] = useState<PharmacyFormData>(emptyForm);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: HospitalOption & { isActive: boolean }) => h.isActive));
    });
  }, [open]);

  useEffect(() => {
    if (editData) {
      const hosp = editData.hospital;
      setForm({
        name: String(editData.name || ''),
        category: String(editData.category || ''),
        quantity: Number(editData.quantity || 0),
        unit: String(editData.unit || 'tablets'),
        minThreshold: Number(editData.minThreshold || 10),
        supplier: String(editData.supplier || ''),
        expiryDate: editData.expiryDate ? String(editData.expiryDate).slice(0, 10) : '',
        unitPrice: Number(editData.unitPrice || 0),
        hospital: typeof hosp === 'object' && hosp !== null ? (hosp as HospitalOption)._id : String(hosp || ''),
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editData, open]);

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true); setError('');

    const url = editData ? `/api/pharmacy/${editData._id}` : '/api/pharmacy';
    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <Modal title={editData ? 'Edit Product' : 'New Product'} onClose={onClose}>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Name *</label>
          <input className={styles.formInput} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g., Amoxicillin 500mg" />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category</label>
            <select className={styles.formSelect} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unit</label>
            <select className={styles.formSelect} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              <option value="tablets">Tablets</option>
              <option value="capsules">Capsules</option>
              <option value="ml">ml</option>
              <option value="vials">Vials</option>
              <option value="bottles">Bottles</option>
              <option value="boxes">Boxes</option>
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Quantity</label>
            <input className={styles.formInput} type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', parseInt(e.target.value) || 0)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Min Threshold</label>
            <input className={styles.formInput} type="number" min="0" value={form.minThreshold} onChange={(e) => set('minThreshold', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unit Price (MAD)</label>
            <input className={styles.formInput} type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => set('unitPrice', parseFloat(e.target.value) || 0)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Expiry Date</label>
            <input className={styles.formInput} type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Supplier</label>
          <input className={styles.formInput} value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Supplier name" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Hospital</label>
          <select className={styles.formSelect} value={form.hospital} onChange={(e) => set('hospital', e.target.value)}>
            <option value="">No hospital (centralized)</option>
            {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editData ? 'Update' : 'Add Product'}</Button>
        </div>
      </form>
    </Modal>
  );
}
