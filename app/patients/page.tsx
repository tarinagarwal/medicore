'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import PatientFormModal from '@/components/patients/PatientFormModal';
import { getInitials, formatDateShort } from '@/lib/utils';
import s from '@/styles/patients.module.css';

interface PatientRow {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  category: string;
  status: string;
  createdAt: string;
  hospital: { _id: string; name: string } | null;
  address: { street: string; city: string; region: string; postalCode: string };
  insuranceInfo: { provider: string; policyNumber: string };
  emergencyContact: { name: string; phone: string; relationship: string };
}

const avatarColors = [
  { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent)' },
  { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
  { bg: 'rgba(139,92,246,0.15)', color: 'var(--purple)' },
  { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
];

export default function PatientsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canCreatePatients = role === 'admin' || role === 'receptionist';
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientRow | null>(null);
  const limit = 20;

  // Fetch hospitals for filter
  useEffect(() => {
    fetch('/api/settings/hospitals').then(r => r.json()).then(j => {
      if (j.success) setHospitals(j.data.filter((h: { isActive: boolean }) => h.isActive));
    });
  }, []);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (hospitalFilter) params.set('hospital', hospitalFilter);

    try {
      const res = await fetch(`/api/patients?${params}`);
      const json = await res.json();
      if (json.success) {
        setPatients(json.data);
        setTotal(json.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status, hospitalFilter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const columns = [
    {
      key: 'name',
      label: 'Patient',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PatientRow;
        const idx = row.patientId ? parseInt(row.patientId.split('-').pop() || '0') : 0;
        const c = avatarColors[idx % avatarColors.length];
        return (
          <div className={s.avatarCell}>
            <div className={s.avatar} style={{ background: c.bg, color: c.color }}>
              {getInitials(row.firstName, row.lastName)}
            </div>
            <div className={s.nameWrap}>
              <div className={s.nameText}>{row.firstName} {row.lastName}</div>
              <div className={s.subText}>{row.patientId}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'gender',
      label: 'Gender / Age',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PatientRow;
        const age = row.dateOfBirth ? new Date().getFullYear() - new Date(row.dateOfBirth).getFullYear() : '?';
        return `${row.gender === 'male' ? 'M' : 'F'}, ${age} yrs`;
      },
    },
    { key: 'phone', label: 'Phone' },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as PatientRow;
        return row.hospital ? row.hospital.name : <span style={{ color: 'var(--muted)' }}>—</span>;
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as PatientRow).category} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as PatientRow).status} />,
    },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (r: Record<string, unknown>) => formatDateShort(new Date((r as unknown as PatientRow).createdAt)),
    },
  ];

  return (
    <div>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1>Patients</h1>
          <p>{total} patient{total !== 1 ? 's' : ''} registered</p>
        </div>
        {canCreatePatients && (
          <Button onClick={() => { setEditPatient(null); setModalOpen(true); }}>
            <Plus size={16} /> New Patient
          </Button>
        )}
      </div>

      <div className={s.controls}>
        <input
          className={s.searchInput}
          placeholder="Search by name, ID, phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className={s.filterSelect} value={hospitalFilter} onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}>
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <select className={s.filterSelect} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          <option value="outpatient">Outpatient</option>
          <option value="hospitalized">Hospitalized</option>
          <option value="external">External</option>
          <option value="emergency">Emergency</option>
        </select>
        <select className={s.filterSelect} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="discharged">Discharged</option>
          <option value="deceased">Deceased</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading patients...</div>
        ) : (
          <DataTable
            columns={columns}
            data={patients as unknown as Record<string, unknown>[]}
            page={page}
            totalPages={Math.ceil(total / limit)}
            total={total}
            onPageChange={setPage}
            onRowClick={(row) => router.push(`/patients/${(row as unknown as PatientRow)._id}`)}
          />
        )}
      </Card>

      <PatientFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPatient(null); }}
        onSaved={fetchPatients}
        editData={editPatient}
      />
    </div>
  );
}
