'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, UserX, Building2, Trash2, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
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

interface SupportRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  adminNotes: string;
  resolvedBy: { firstName: string; lastName: string } | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'doctor', department: '', hospital: '' });
  const [hospitalForm, setHospitalForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [supportForm, setSupportForm] = useState({ status: '', adminNotes: '' });
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

  const fetchSupportRequests = async () => {
    try { const res = await fetch('/api/support'); const json = await res.json(); if (json.success) setSupportRequests(json.data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); fetchHospitals(); fetchSupportRequests(); }, []);

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

  // ── Support CRUD ──
  const handleUpdateSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/support/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSupportModalOpen(false); fetchSupportRequests();
      setSupportForm({ status: '', adminNotes: '' });
      setSelectedRequest(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteSupport = async (id: string) => {
    if (!confirm('Delete this support request?')) return;
    await fetch(`/api/support/${id}`, { method: 'DELETE' });
    fetchSupportRequests();
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
        if (typeof row.hospital === 'object' && row.hospital?.name) return row.hospital.name;
        if (typeof row.hospital === 'string') {
          const h = hospitals.find(h => h._id === row.hospital);
          return h?.name || <span style={{ color: 'var(--muted)' }}>—</span>;
        }
        return <span style={{ color: 'var(--muted)' }}>—</span>;
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

  // ── Support columns ──
  const supportColumns = [
    {
      key: 'subject', label: 'Request',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as SupportRequest;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{row.subject}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{row.name} • {row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as SupportRequest;
        const statusMap: Record<string, { label: string; status: string }> = {
          pending: { label: 'Pending', status: 'pending' },
          'in-progress': { label: 'In Progress', status: 'scheduled' },
          resolved: { label: 'Resolved', status: 'completed' },
          closed: { label: 'Closed', status: 'cancelled' },
        };
        const s = statusMap[row.status] || { label: row.status, status: 'pending' };
        return <StatusBadge status={s.status} label={s.label} />;
      },
    },
    {
      key: 'createdAt', label: 'Submitted',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as SupportRequest;
        return new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      },
    },
    {
      key: 'actions', label: '',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as SupportRequest;
        if (!isAdmin) return null;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(row);
                setSupportForm({ status: row.status, adminNotes: row.adminNotes });
                setSupportModalOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}
            >
              Manage
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSupport(row._id); }}
              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
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

      <Tabs tabs={[{ label: 'Users', value: 'users' }, { label: 'Hospitals', value: 'hospitals' }, { label: 'Support', value: 'support' }]} active={tab} onChange={setTab} />

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

      {tab === 'support' && (
        <Card style={{ marginTop: '16px' }}>
          <CardHeader title="Support Requests" right={<span style={{ fontSize: '12px', color: 'var(--muted)' }}>{supportRequests.length} request{supportRequests.length !== 1 ? 's' : ''}</span>} />
          {supportRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>No support requests yet</div>
          ) : (
            <DataTable columns={supportColumns} data={supportRequests as unknown as Record<string, unknown>[]} />
          )}
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

      {/* ── Manage Support Request Modal ── */}
      {supportModalOpen && selectedRequest && (
        <Modal title="Manage Support Request" onClose={() => { setSupportModalOpen(false); setSelectedRequest(null); }}>
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{selectedRequest.subject}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
              From: {selectedRequest.name} ({selectedRequest.email})
              {selectedRequest.phone && ` • ${selectedRequest.phone}`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '12px', padding: '12px', background: 'var(--card)', borderRadius: 'var(--radius-sm)' }}>
              {selectedRequest.message}
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleUpdateSupport}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={supportForm.status} onChange={(e) => setSupportForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Notes</label>
              <textarea
                className={styles.formInput}
                value={supportForm.adminNotes}
                onChange={(e) => setSupportForm(p => ({ ...p, adminNotes: e.target.value }))}
                placeholder="Add internal notes about this request..."
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" type="button" onClick={() => { setSupportModalOpen(false); setSelectedRequest(null); }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Request'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
