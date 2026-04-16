'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ImagingFormModal from '@/components/imaging/ImagingFormModal';
import { formatDateShort } from '@/lib/utils';
import s from '@/styles/imaging.module.css';

interface ImagingRow {
  _id: string;
  studyId: string;
  patient: { firstName: string; lastName: string; patientId: string } | null;
  doctor: { firstName: string; lastName: string } | null;
  hospital: { _id: string; name: string } | null;
  type: string;
  bodyPart: string;
  status: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  xray: 'X-Ray', ultrasound: 'Ultrasound', ct: 'CT Scan', mri: 'MRI', echocardiography: 'Echo', other: 'Other',
};

export default function ImagingPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<ImagingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 20;

  const fetchStudies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (hospitalFilter) params.set('hospital', hospitalFilter);

    try {
      const res = await fetch(`/api/imaging?${params}`);
      const json = await res.json();
      if (json.success) { setStudies(json.data); setTotal(json.pagination.total); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter, hospitalFilter]);

  useEffect(() => { fetchStudies(); }, [fetchStudies]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('/api/settings/hospitals?status=active');
        const json = await res.json();
        if (json.success) setHospitals(json.data);
      } catch (err) { console.error(err); }
    };
    fetchHospitals();
  }, []);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/imaging/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    fetchStudies();
  };

  const columns = [
    { key: 'studyId', label: 'ID' },
    {
      key: 'patient', label: 'Patient',
      render: (r: Record<string, unknown>) => { const row = r as unknown as ImagingRow; return row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—'; },
    },
    {
      key: 'type', label: 'Type',
      render: (r: Record<string, unknown>) => <StatusBadge status={(r as unknown as ImagingRow).type} label={typeLabels[(r as unknown as ImagingRow).type] || (r as unknown as ImagingRow).type} />,
    },
    { key: 'bodyPart', label: 'Body Part' },
    {
      key: 'doctor', label: 'Doctor',
      render: (r: Record<string, unknown>) => { const row = r as unknown as ImagingRow; return row.doctor ? `Dr. ${row.doctor.firstName} ${row.doctor.lastName}` : '—'; },
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as ImagingRow;
        return row.hospital?.name || <span style={{ color: 'var(--muted)' }}>—</span>;
      },
    },
    {
      key: 'status', label: 'Status',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as ImagingRow;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={row.status} />
            {row.status === 'requested' && <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'scheduled'); }}>Schedule</button>}
            {row.status === 'scheduled' && <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'completed'); }}>Complete</button>}
            {row.status === 'completed' && <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'archived'); }}>Archive</button>}
          </div>
        );
      },
    },
    {
      key: 'createdAt', label: 'Date',
      render: (r: Record<string, unknown>) => formatDateShort(new Date((r as unknown as ImagingRow).createdAt)),
    },
  ];

  return (
    <div>
      <div className={s.header}>
        <div className={s.headerLeft}><h1>Imaging (PACS)</h1><p>{total} imaging stud{total !== 1 ? 'ies' : 'y'}</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Imaging Request</Button>
      </div>
      <div className={s.controls}>
        <input className={s.searchInput} placeholder="Search by ID or body part..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <select className={s.filterSelect} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="xray">X-Ray</option><option value="ultrasound">Ultrasound</option><option value="ct">CT Scan</option><option value="mri">MRI</option><option value="echocardiography">Echocardiography</option><option value="other">Other</option>
        </select>
        <select className={s.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="requested">Requested</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="archived">Archived</option>
        </select>
        <select className={s.filterSelect} value={hospitalFilter} onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}>
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>
        ) : (
          <DataTable columns={columns} data={studies as unknown as Record<string, unknown>[]} page={page} totalPages={Math.ceil(total / limit)} total={total} onPageChange={setPage}
            onRowClick={(row) => router.push(`/imaging/${(row as unknown as ImagingRow)._id}`)} />
        )}
      </Card>
      <ImagingFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchStudies} />
    </div>
  );
}
