'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, UserX, Building2, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { getInitials } from '@/lib/utils';
import styles from '@/styles/ui.module.css';

interface UserRow {
  _id: string; firstName: string; lastName: string; email: string; role: string; department: string; isActive: boolean;
  hospital: { _id: string; name: string } | string | null;
}

interface HospitalRow {
  _id: string; name: string; address: string; phone: string; email: string; isActive: boolean;
}

const roles = [
  { value: 'admin', label: 'Administrator' }, { value: 'doctor', label: 'Doctor' }, { value: 'nurse', label: 'Nurse' },
  { value: 'lab-tech', label: 'Lab Technician' }, { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'receptionist', label: 'Receptionist' }, { value: 'billing', label: 'Billing Staff' },
];

const roleLabels: Record<string, string> = Object.fromEntries(roles.map(r => [r.value, r.label]));

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'doctor', department: '', hospital: '' });
  const [hospitalForm, setHospitalForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try { const res = await fetch('/api/settings/users'); const json = await res.json(); if (json.success) setUsers(json.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchHospitals = async () => {
    try { const res = await fetch('/api/settings/hospitals'); const json = await res.json(); if (json.success) setHospitals(json.data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); fetchHospitals(); }, []);

  const isAdmin = session?.user?.role === 'admin';

  // ── User CRUD ──
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/settings/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setModalOpen(false); fetchUsers();
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'doctor', department: '', hospital: '' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const deactivateUser = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    await fetch(`/api/settings/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  // ── Hospital CRUD ──
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name) { setError('Hospital name is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/settings/hospitals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hospitalForm) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHospitalModalOpen(false); fetchHospitals();
      setHospitalForm({ name: '', address: '', phone: '', email: '' });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const deactivateHospital = async (id: string) => {
    if (!confirm('Deactivate this hospital?')) return;
    await fetch(`/api/settings/hospitals/${id}`, { method: 'DELETE' });
    fetchHospitals();
  };

  // ── User columns ──
  const userColumns = [
    {
      key: 'name', label: 'User',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as UserRow;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'white', flexShrink: 0 }}>
              {getInitials(row.firstName, row.lastName)}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{row.firstName} {row.lastName}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{row.email}</div>
            </div>
          </div>
        );
      },
    },
    { key: 'role', label: 'Role', render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as UserRow).role} label={roleLabels[(r as unknown as UserRow).role] || (r as unknown as UserRow).role} /> },
    { key: 'department', label: 'Department' },
    {
      key: 'hospital', label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as UserRow;
        if (!row.hospital) return <span style={{ color: 'var(--muted)' }}>—</span>;
        if (typeof row.hospital === 'object') return row.hospital.name;
        const h = hospitals.find(h => h._id === row.hospital);
        return h ? h.name : '—';
      },
    },
    {
      key: 'isActive', label: 'Status',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as UserRow).isActive ? 'active' : 'discharged'} label={(r as unknown as UserRow).isActive ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions', label: '',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as UserRow;
        if (!isAdmin || row._id === session?.user?.id) return null;
        return row.isActive ? (
          <button onClick={(e) => { e.stopPropagation(); deactivateUser(row._id); }}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <UserX size={14} /> Deactivate
          </button>
        ) : null;
      },
    },
  ];

  // ── Hospital columns ──
  const hospitalColumns = [
    {
      key: 'name', label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as HospitalRow;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{row.name}</div>
              {row.address && <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{row.address}</div>}
            </div>
          </div>
        );
      },
    },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    {
      key: 'isActive', label: 'Status',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as HospitalRow).isActive ? 'active' : 'discharged'} label={(r as unknown as HospitalRow).isActive ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions', label: '',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as HospitalRow;
        if (!isAdmin) return null;
        return row.isActive ? (
          <button onClick={(e) => { e.stopPropagation(); deactivateHospital(row._id); }}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <Trash2 size={14} /> Deactivate
          </button>
        ) : null;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 400, marginBottom: '4px' }}>Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Manage users, hospitals, and system configuration</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {tab === 'users' && <Button onClick={() => { setError(''); setModalOpen(true); }}><Plus size={16} /> Add User</Button>}
            {tab === 'hospitals' && <Button onClick={() => { setError(''); setHospitalModalOpen(true); }}><Plus size={16} /> Add Hospital</Button>}
          </div>
        )}
      </div>

      <Tabs tabs={[{ label: 'Users', value: 'users' }, { label: 'Hospitals', value: 'hospitals' }]} active={tab} onChange={setTab} />

      {tab === 'users' && (
        <Card style={{ marginTop: '16px' }}>
          <CardHeader title="Users" right={<span style={{ fontSize: '12px', color: 'var(--muted)' }}>{users.length} user{users.length !== 1 ? 's' : ''}</span>} />
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div> : (
            <DataTable columns={userColumns} data={users as unknown as Record<string, unknown>[]} />
          )}
        </Card>
      )}

      {tab === 'hospitals' && (
        <Card style={{ marginTop: '16px' }}>
          <CardHeader title="Hospitals" right={<span style={{ fontSize: '12px', color: 'var(--muted)' }}>{hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''}</span>} />
          <DataTable columns={hospitalColumns} data={hospitals as unknown as Record<string, unknown>[]} />
        </Card>
      )}

      {/* ── Add User Modal ── */}
      {modalOpen && (
        <Modal title="Add New User" onClose={() => setModalOpen(false)}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleCreateUser}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}><label className={styles.formLabel}>First Name *</label><input className={styles.formInput} value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} required /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Last Name *</label><input className={styles.formInput} value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} required /></div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Email *</label><input className={styles.formInput} type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Password *</label><input className={styles.formInput} type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} required /></div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role *</label>
                <select className={styles.formSelect} value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Department</label><input className={styles.formInput} value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} /></div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hospital</label>
              <select className={styles.formSelect} value={form.hospital} onChange={(e) => setForm(p => ({ ...p, hospital: e.target.value }))}>
                <option value="">No hospital (centralized)</option>
                {hospitals.filter(h => h.isActive).map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Hospital Modal ── */}
      {hospitalModalOpen && (
        <Modal title="Add New Hospital" onClose={() => setHospitalModalOpen(false)}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleCreateHospital}>
            <div className={styles.formGroup}><label className={styles.formLabel}>Name *</label><input className={styles.formInput} value={hospitalForm.name} onChange={(e) => setHospitalForm(p => ({ ...p, name: e.target.value }))} required placeholder="Hospital name" /></div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Address</label><input className={styles.formInput} value={hospitalForm.address} onChange={(e) => setHospitalForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" /></div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Phone</label><input className={styles.formInput} value={hospitalForm.phone} onChange={(e) => setHospitalForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Email</label><input className={styles.formInput} type="email" value={hospitalForm.email} onChange={(e) => setHospitalForm(p => ({ ...p, email: e.target.value }))} placeholder="Contact email" /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" type="button" onClick={() => setHospitalModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Hospital'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
