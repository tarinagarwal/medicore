'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Tabs from '@/components/ui/Tabs';
import PatientFormModal from '@/components/patients/PatientFormModal';
import { getInitials, formatDateShort, formatDateLong } from '@/lib/utils';
import s from '@/styles/patients.module.css';

interface PatientDetail {
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
  address: { street: string; city: string; region: string; postalCode: string };
  insuranceInfo: { provider: string; policyNumber: string };
  emergencyContact: { name: string; phone: string; relationship: string };
}

interface RelatedAppointment {
  _id: string;
  dateTime: string;
  department: string;
  status: string;
  reason: string;
  doctor: { firstName: string; lastName: string };
}

interface RelatedRecord {
  _id: string;
  recordId: string;
  type: string;
  createdAt: string;
  doctor: { firstName: string; lastName: string };
}

interface RelatedLab {
  _id: string;
  requestId: string;
  status: string;
  createdAt: string;
  tests: { name: string }[];
}

interface RelatedInvoice {
  _id: string;
  invoiceId: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
}

export default function PatientProfilePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<{
    patient: PatientDetail;
    appointments: RelatedAppointment[];
    records: RelatedRecord[];
    labRequests: RelatedLab[];
    invoices: RelatedInvoice[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('appointments');
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to discharge this patient?')) return;
    await fetch(`/api/patients/${params.id}`, { method: 'DELETE' });
    router.push('/patients');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Loading...</div>;
  }

  if (!data?.patient) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Patient not found</div>;
  }

  const p = data.patient;
  const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '?';
  const initials = getInitials(p.firstName, p.lastName);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Button variant="secondary" onClick={() => router.push('/patients')}>
          <ArrowLeft size={14} /> Back to Patients
        </Button>
      </div>

      <div className={s.profileHeader}>
        <div className={s.profileAvatar}>{initials}</div>
        <div className={s.profileInfo}>
          <h1>{p.firstName} {p.lastName}</h1>
          <div className={s.profileMeta}>
            <span>{p.patientId}</span>
            <span>{p.gender === 'male' ? 'Male' : 'Female'}, {age} yrs</span>
            <StatusBadge status={p.status} />
            <StatusBadge status={p.category} />
          </div>
        </div>
        <div className={s.profileActions}>
          {isAdmin && (
            <>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Edit size={14} /> Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 size={14} /> Discharge
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info + Related Data */}
      <div className={s.profileGrid}>
        {/* Left: Patient Details */}
        <Card>
          <CardHeader title="Patient Information" />
          <div className={s.detailRow}><span className={s.detailLabel}>Date of Birth</span><span className={s.detailValue}>{p.dateOfBirth ? formatDateLong(new Date(p.dateOfBirth)) : '—'}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Phone</span><span className={s.detailValue}>{p.phone || '—'}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Email</span><span className={s.detailValue}>{p.email || '—'}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Address</span><span className={s.detailValue}>{[p.address?.street, p.address?.city, p.address?.region].filter(Boolean).join(', ') || '—'}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Insurance</span><span className={s.detailValue}>{p.insuranceInfo?.provider || '—'}{p.insuranceInfo?.policyNumber ? ` (${p.insuranceInfo.policyNumber})` : ''}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Emergency Contact</span><span className={s.detailValue}>{p.emergencyContact?.name || '—'}{p.emergencyContact?.phone ? ` — ${p.emergencyContact.phone}` : ''}</span></div>
          <div className={s.detailRow}><span className={s.detailLabel}>Registered</span><span className={s.detailValue}>{formatDateShort(new Date(p.createdAt))}</span></div>
        </Card>

        {/* Right: Tabs with related data */}
        <Card>
          <Tabs
            tabs={[
              { label: `Appointments (${data.appointments.length})`, value: 'appointments' },
              { label: `Records (${data.records.length})`, value: 'records' },
              { label: `Lab (${data.labRequests.length})`, value: 'lab' },
              { label: `Invoices (${data.invoices.length})`, value: 'invoices' },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className={s.tabContent}>
            {tab === 'appointments' && (
              <DataTable
                columns={[
                  { key: 'dateTime', label: 'Date', render: (r) => formatDateShort(new Date((r as unknown as RelatedAppointment).dateTime)) },
                  { key: 'department', label: 'Department' },
                  { key: 'doctor', label: 'Doctor', render: (r) => { const d = (r as unknown as RelatedAppointment).doctor; return d ? `Dr. ${d.firstName} ${d.lastName}` : '—'; } },
                  { key: 'reason', label: 'Reason' },
                  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={(r as unknown as RelatedAppointment).status} /> },
                ]}
                data={data.appointments as unknown as Record<string, unknown>[]}
              />
            )}

            {tab === 'records' && (
              <DataTable
                columns={[
                  { key: 'recordId', label: 'ID' },
                  { key: 'type', label: 'Type', render: (r) => <StatusBadge status={(r as unknown as RelatedRecord).type} label={(r as unknown as RelatedRecord).type} /> },
                  { key: 'doctor', label: 'Doctor', render: (r) => { const d = (r as unknown as RelatedRecord).doctor; return d ? `Dr. ${d.firstName} ${d.lastName}` : '—'; } },
                  { key: 'createdAt', label: 'Date', render: (r) => formatDateShort(new Date((r as unknown as RelatedRecord).createdAt)) },
                ]}
                data={data.records as unknown as Record<string, unknown>[]}
              />
            )}

            {tab === 'lab' && (
              <DataTable
                columns={[
                  { key: 'requestId', label: 'ID' },
                  { key: 'tests', label: 'Tests', render: (r) => (r as unknown as RelatedLab).tests.map((t) => t.name).join(', ') },
                  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={(r as unknown as RelatedLab).status} /> },
                  { key: 'createdAt', label: 'Date', render: (r) => formatDateShort(new Date((r as unknown as RelatedLab).createdAt)) },
                ]}
                data={data.labRequests as unknown as Record<string, unknown>[]}
              />
            )}

            {tab === 'invoices' && (
              <DataTable
                columns={[
                  { key: 'invoiceId', label: 'Invoice #' },
                  { key: 'totalAmount', label: 'Total', render: (r) => `${(r as unknown as RelatedInvoice).totalAmount} MAD` },
                  { key: 'paidAmount', label: 'Paid', render: (r) => `${(r as unknown as RelatedInvoice).paidAmount} MAD` },
                  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={(r as unknown as RelatedInvoice).status} /> },
                  { key: 'createdAt', label: 'Date', render: (r) => formatDateShort(new Date((r as unknown as RelatedInvoice).createdAt)) },
                ]}
                data={data.invoices as unknown as Record<string, unknown>[]}
              />
            )}
          </div>
        </Card>
      </div>

      <PatientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchData}
        editData={editOpen ? p : null}
      />
    </div>
  );
}
