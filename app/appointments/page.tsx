'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Plus, List, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal';
import { getInitials, formatDateShort } from '@/lib/utils';
import s from '@/styles/appointments.module.css';
import cal from '@/styles/calendar.module.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface AppointmentRow {
  _id: string;
  patient: { _id: string; firstName: string; lastName: string; patientId: string; gender: string; dateOfBirth: string } | null;
  doctor: { _id: string; firstName: string; lastName: string } | null;
  hospital: { _id: string; name: string } | null;
  department: string;
  dateTime: string;
  duration: number;
  reason: string;
  status: string;
  notes: string;
}

const avatarColors = [
  { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent)' },
  { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
  { bg: 'rgba(139,92,246,0.15)', color: 'var(--purple)' },
  { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editApt, setEditApt] = useState<AppointmentRow | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calView, setCalView] = useState<View>('week');
  const [calDate, setCalDate] = useState(new Date());
  const limit = 20;

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (departmentFilter) params.set('department', departmentFilter);
    if (hospitalFilter) params.set('hospital', hospitalFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    try {
      const res = await fetch(`/api/appointments?${params}`);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data);
        setTotal(json.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter, hospitalFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

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
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAppointments();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calendar events
  const calendarEvents = useMemo(() =>
    appointments.map((apt) => ({
      id: apt._id,
      title: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName} — ${apt.department}` : apt.department,
      start: new Date(apt.dateTime),
      end: new Date(new Date(apt.dateTime).getTime() + (apt.duration || 30) * 60000),
      resource: apt,
    })),
    [appointments]
  );

  const eventStyleGetter = (event: { resource: AppointmentRow }) => ({
    className: `event-${event.resource.status}`,
  });

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as AppointmentRow;
        const p = row.patient;
        if (!p) return <span style={{ color: 'var(--muted)' }}>—</span>;
        const i = parseInt(p.patientId?.split('-').pop() || '0');
        const c = avatarColors[i % avatarColors.length];
        return (
          <div className={s.avatarCell}>
            <div className={s.avatar} style={{ background: c.bg, color: c.color }}>
              {getInitials(p.firstName, p.lastName)}
            </div>
            <div>
              <div className={s.nameText}>{p.firstName} {p.lastName}</div>
              <div className={s.subText}>{p.patientId}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as AppointmentRow;
        return `${formatDateShort(new Date(row.dateTime))} ${formatTime(row.dateTime)}`;
      },
    },
    { key: 'department', label: 'Department' },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as AppointmentRow;
        return row.doctor ? `Dr. ${row.doctor.firstName} ${row.doctor.lastName}` : '—';
      },
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as AppointmentRow;
        return row.hospital ? row.hospital.name : <span style={{ color: 'var(--muted)' }}>—</span>;
      },
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => {
        const row = r as unknown as AppointmentRow;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={row.status} />
            {row.status !== 'completed' && row.status !== 'cancelled' && row.status !== 'no-show' && (
              <div className={s.statusActions}>
                {row.status === 'scheduled' && (
                  <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'confirmed'); }}>Confirm</button>
                )}
                {row.status === 'confirmed' && (
                  <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'in-progress'); }}>Start</button>
                )}
                {(row.status === 'in-progress' || row.status === 'in-preparation') && (
                  <button className={s.statusBtn} onClick={(e) => { e.stopPropagation(); updateStatus(row._id, 'completed'); }}>Complete</button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1>Appointments</h1>
          <p>{total} appointment{total !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className={cal.viewToggle}>
            <button className={`${cal.viewBtn} ${viewMode === 'list' ? cal.active : ''}`} onClick={() => setViewMode('list')}>
              <List size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> List
            </button>
            <button className={`${cal.viewBtn} ${viewMode === 'calendar' ? cal.active : ''}`} onClick={() => setViewMode('calendar')}>
              <CalendarDays size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Calendar
            </button>
          </div>
          <Button onClick={() => { setEditApt(null); setModalOpen(true); }}>
            <Plus size={16} /> New Appointment
          </Button>
        </div>
      </div>

      <div className={s.controls}>
        <input
          className={s.searchInput}
          placeholder="Search patient name or ID..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className={s.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-preparation">In Preparation</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </select>
        <select className={s.filterSelect} value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {['Cardiology', 'Gynecology', 'Pediatrics', 'Neurology', 'Surgery', 'Ophthalmology', 'Dermatology', 'Emergency', 'General Medicine', 'Orthopedics'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className={s.filterSelect} value={hospitalFilter} onChange={(e) => { setHospitalFilter(e.target.value); setPage(1); }}>
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <input className={s.dateInput} type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
        <input className={s.dateInput} type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="To date" />
      </div>

      {viewMode === 'list' ? (
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading appointments...</div>
          ) : (
            <DataTable
              columns={columns}
              data={appointments as unknown as Record<string, unknown>[]}
              page={page}
              totalPages={Math.ceil(total / limit)}
              total={total}
              onPageChange={setPage}
              onRowClick={(row) => {
                router.push(`/appointments/${(row as unknown as AppointmentRow)._id}`);
              }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <div className={cal.calendarContainer}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading appointments...</div>
            ) : (
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={calView}
                onView={(v) => setCalView(v)}
                date={calDate}
                onNavigate={(d) => setCalDate(d)}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  setEditApt(event.resource);
                  setModalOpen(true);
                }}
                style={{ minHeight: 600 }}
                views={['month', 'week', 'day']}
                step={15}
                timeslots={4}
                min={new Date(0, 0, 0, 7, 0)}
                max={new Date(0, 0, 0, 21, 0)}
              />
            )}
          </div>
        </Card>
      )}

      <AppointmentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditApt(null); }}
        onSaved={fetchAppointments}
        editData={editApt as never}
      />
    </div>
  );
}
