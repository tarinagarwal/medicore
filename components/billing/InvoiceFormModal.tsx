'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from '@/styles/ui.module.css';

interface LineItem { description: string; category: string; amount: number; }
interface PatientOption { _id: string; firstName: string; lastName: string; patientId: string; }
interface HospitalOption { _id: string; name: string; }

interface Props { open: boolean; onClose: () => void; onSaved: () => void; }

export default function InvoiceFormModal({ open, onClose, onSaved }: Props) {
  const [patient, setPatient] = useState('');
  const [hospital, setHospital] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description: '', category: 'consultation', amount: 0 }]);
  const [notes, setNotes] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/patients?limit=200').then(r => r.json()).then(j => { if (j.success) setPatients(j.data); });
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: HospitalOption & { isActive: boolean }) => h.isActive));
    });
    setPatient(''); setHospital(''); setItems([{ description: '', category: 'consultation', amount: 0 }]); setNotes(''); setError('');
  }, [open]);

  const addItem = () => setItems(prev => [...prev, { description: '', category: 'consultation', amount: 0 }]);
  const updateItem = (i: number, field: string, value: string | number) => {
    setItems(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  };
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter(i => i.description && i.amount > 0);
    if (!patient || valid.length === 0) { setError('Patient and at least one line item required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient, items: valid, notes, hospital }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <Modal title="New Invoice" onClose={onClose}>
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

        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Line Items *</span>
          <button type="button" onClick={addItem} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>+ Add Item</button>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
            <input className={styles.formInput} value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description" />
            <select className={styles.formSelect} value={item.category} onChange={(e) => updateItem(i, 'category', e.target.value)}>
              <option value="consultation">Consultation</option><option value="lab">Lab</option><option value="imaging">Imaging</option><option value="pharmacy">Pharmacy</option><option value="procedure">Procedure</option>
            </select>
            <input className={styles.formInput} type="number" min="0" value={item.amount} onChange={(e) => updateItem(i, 'amount', parseFloat(e.target.value) || 0)} placeholder="Amount" />
            {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '14px' }}>×</button>}
          </div>
        ))}
        <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>Total: {total} MAD</div>

        <div className={styles.formGroup} style={{ marginTop: '16px' }}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Invoice notes..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</Button>
        </div>
      </form>
    </Modal>
  );
}
