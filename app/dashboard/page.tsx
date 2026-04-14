'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  FlaskConical,
  DollarSign,
  CalendarDays,
  FileText,
  Search,
  Home,
} from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { Card, CardHeader } from '@/components/ui/Card';
import PatientRow from '@/components/ui/PatientRow';
import AlertItem from '@/components/ui/AlertItem';
import ModuleCard from '@/components/ui/ModuleCard';
import ReceptionistDashboard from '@/components/dashboards/ReceptionistDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import AdminBanner from '@/components/dashboards/AdminBanner';
import ActivityItem from '@/components/ui/ActivityItem';
import StatusBadge from '@/components/ui/StatusBadge';
import Tabs from '@/components/ui/Tabs';
import BarChart from '@/components/charts/BarChart';
import DonutChart from '@/components/charts/DonutChart';
import { formatDateLong, formatCurrency, getInitials, timeAgo } from '@/lib/utils';
import styles from '@/styles/dashboard.module.css';

interface DashboardData {
  kpis: {
    patientsToday: number;
    patientsDelta: number;
    admissionsToday: number;
    labAnalyses: number;
    labPending: number;
    revenue: number;
    revenueDelta: number;
  };
  waitingRoom: Array<{
    _id: string;
    patient: { firstName: string; lastName: string; gender: string; dateOfBirth: string };
    doctor: { firstName: string; lastName: string };
    department: string;
    dateTime: string;
    status: string;
  }>;
  upcoming: Array<{
    _id: string;
    patient: { firstName: string; lastName: string };
    department: string;
    dateTime: string;
    status: string;
  }>;
  alerts: Array<{
    _id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>;
  moduleCounts: {
    patients: number;
    records: number;
    labAnalyses: number;
    imagingExams: number;
    pharmacyProducts: number;
    invoices: number;
  };
  consultationsByDept: Array<{ _id: string; count: number }>;
  patientDistribution: Array<{ _id: string; count: number }>;
  activityLog: Array<{
    _id: string;
    action: string;
    details: string;
    color: string;
    createdAt: string;
    user: { firstName: string; lastName: string };
  }>;
}

const avatarColors = ['blue', 'red', 'green', 'purple', 'amber'] as const;

const deptColors: Record<string, string> = {
  Cardiology: 'var(--accent)',
  Gynecology: 'var(--purple)',
  Pediatrics: 'var(--green)',
  Neurology: 'var(--amber)',
  Surgery: 'var(--red)',
};

const categoryColors: Record<string, string> = {
  outpatient: 'var(--accent)',
  hospitalized: 'var(--purple)',
  external: 'var(--green)',
  emergency: 'var(--amber)',
};

const categoryLabels: Record<string, string> = {
  outpatient: 'Outpatient',
  hospitalized: 'Hospitalized',
  external: 'External',
  emergency: 'Emergency',
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const userName = session?.user?.name || 'User';

  if (role === 'receptionist') return <ReceptionistDashboard userName={userName} />;
  if (role === 'doctor') return <DoctorDashboard userName={userName} />;

  return <AdminDashboard userName={userName} />;
}

function AdminDashboard({ userName }: { userName: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingTab, setWaitingTab] = useState('all');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.firstName || 'Doctor';

  const filteredWaiting = data?.waitingRoom.filter((apt) => {
    if (waitingTab === 'emergencies') return apt.department?.toLowerCase().includes('emergency') || apt.status === 'urgent';
    if (waitingTab === 'consultations') return !apt.department?.toLowerCase().includes('emergency');
    return true;
  }) || [];

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const age = new Date().getFullYear() - birth.getFullYear();
    return age;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  const kpis = data?.kpis || { patientsToday: 0, patientsDelta: 0, admissionsToday: 0, labAnalyses: 0, labPending: 0, revenue: 0, revenueDelta: 0 };
  const mc = data?.moduleCounts || { patients: 0, records: 0, labAnalyses: 0, imagingExams: 0, pharmacyProducts: 0, invoices: 0 };

  return (
    <div>
      <AdminBanner userName={userName} />

      {/* ── Welcome Strip ── */}
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>Good morning, {firstName}</h1>
        <p className={styles.welcomeSubtitle}>Here&apos;s an overview of the clinic for today.</p>
        <div className={styles.dateBadge}>
          <CalendarDays size={12} />
          {formatDateLong(new Date())}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Patients Today"
          value={kpis.patientsToday}
          delta={`${kpis.patientsDelta >= 0 ? '↑' : '↓'} ${kpis.patientsDelta >= 0 ? '+' : ''}${kpis.patientsDelta} vs. yesterday`}
          deltaDirection={kpis.patientsDelta >= 0 ? 'up' : 'down'}
          color="blue"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Admissions"
          value={kpis.admissionsToday}
          delta={`↑ +${kpis.admissionsToday} new`}
          deltaDirection="up"
          color="green"
          icon={<Activity size={18} />}
        />
        <KpiCard
          label="Analyses (LIS)"
          value={kpis.labAnalyses}
          delta={`${kpis.labPending} pending`}
          deltaDirection={kpis.labPending > 0 ? 'down' : 'up'}
          color="amber"
          icon={<FlaskConical size={18} />}
        />
        <KpiCard
          label="Revenue (MAD)"
          value={formatCurrency(kpis.revenue)}
          delta={`${kpis.revenueDelta >= 0 ? '↑' : '↓'} ${kpis.revenueDelta >= 0 ? '+' : ''}${kpis.revenueDelta}% this month`}
          deltaDirection={kpis.revenueDelta >= 0 ? 'up' : 'down'}
          color="purple"
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* ── Row 1: Waiting Room + Alerts ── */}
      <div className={styles.grid3}>
        <Card>
          <CardHeader
            title="Current Patients — Waiting Room"
            action="View all →"
            onAction={() => router.push('/appointments')}
          />
          <Tabs
            tabs={[
              { label: `All (${data?.waitingRoom.length || 0})`, value: 'all' },
              { label: 'Emergencies', value: 'emergencies' },
              { label: 'Consultations', value: 'consultations' },
            ]}
            active={waitingTab}
            onChange={setWaitingTab}
          />
          {filteredWaiting.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px', fontSize: '13px' }}>
              No patients in waiting room
            </div>
          ) : (
            filteredWaiting.slice(0, 5).map((apt, i) => {
              const p = apt.patient;
              const initials = p ? getInitials(p.firstName, p.lastName) : '??';
              const name = p ? `${p.firstName} ${p.lastName}` : 'Unknown';
              const gender = p?.gender === 'male' ? 'M' : 'F';
              const age = p?.dateOfBirth ? getAge(p.dateOfBirth) : '?';
              return (
                <PatientRow
                  key={apt._id}
                  initials={initials}
                  name={name}
                  info={`${gender}, ${age} yrs · ${apt.department}`}
                  time={formatTime(apt.dateTime)}
                  status={apt.status}
                  avatarColor={avatarColors[i % avatarColors.length]}
                />
              );
            })
          )}
        </Card>

        <Card>
          <CardHeader title="System Alerts" right={
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {data?.alerts.length || 0} active
            </span>
          } />
          {(data?.alerts.length || 0) === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px', fontSize: '13px' }}>
              No active alerts
            </div>
          ) : (
            data?.alerts.map((alert) => (
              <AlertItem
                key={alert._id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
              />
            ))
          )}

          <div style={{ marginTop: '18px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
              Upcoming Appointments
            </div>
            {(data?.upcoming.length || 0) === 0 ? (
              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                No upcoming appointments today
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data?.upcoming.map((apt) => (
                  <div key={apt._id} className={styles.upcomingRow}>
                    <span className={styles.upcomingTime}>{formatTime(apt.dateTime)}</span>
                    <span className={styles.upcomingName}>
                      {apt.patient?.firstName} {apt.patient?.lastName} — {apt.department}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 2: Modules + Stats ── */}
      <div className={styles.grid2}>
        <Card>
          <CardHeader title="Clinical Modules" action="Manage →" />
          <div className={styles.modulesGrid}>
            <ModuleCard
              href="/records"
              icon={<FileText size={20} />}
              iconBg="rgba(59,130,246,0.1)"
              iconColor="var(--accent)"
              name="DME / DSE"
              description="Shared electronic medical records"
              count={`${mc.records} records`}
            />
            <ModuleCard
              href="/lab"
              icon={<FlaskConical size={20} />}
              iconBg="rgba(16,185,129,0.1)"
              iconColor="var(--green)"
              name="Laboratory LIS"
              description="Analyses & results management"
              count={`${mc.labAnalyses} analyses`}
            />
            <ModuleCard
              href="/imaging"
              icon={<Search size={20} />}
              iconBg="rgba(139,92,246,0.1)"
              iconColor="var(--purple)"
              name="Imaging PACS"
              description="Archiving & image viewing"
              count={`${mc.imagingExams} exams`}
            />
            <ModuleCard
              href="/pharmacy"
              icon={<Home size={20} />}
              iconBg="rgba(245,158,11,0.1)"
              iconColor="var(--amber)"
              name="Pharmacy"
              description="Stock, prescriptions & dispensation"
              count={`${mc.pharmacyProducts} products`}
            />
            <ModuleCard
              href="/billing"
              icon={<DollarSign size={20} />}
              iconBg="rgba(6,182,212,0.1)"
              iconColor="var(--accent2)"
              name="Billing"
              description="Cash, reimbursements & CNSS"
              count={`${mc.invoices} invoices`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Consultations this month" action="Report →" />
          <BarChart
            data={
              data?.consultationsByDept.length
                ? data.consultationsByDept.map((d) => ({
                    label: d._id || 'Other',
                    value: d.count,
                    color: deptColors[d._id] || 'var(--accent)',
                  }))
                : [
                    { label: 'Cardiology', value: 0, color: 'var(--accent)' },
                    { label: 'Gynecology', value: 0, color: 'var(--purple)' },
                    { label: 'Pediatrics', value: 0, color: 'var(--green)' },
                    { label: 'Neurology', value: 0, color: 'var(--amber)' },
                    { label: 'Surgery', value: 0, color: 'var(--red)' },
                  ]
            }
          />

          <div style={{ marginTop: '22px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>
              Patient Distribution
            </div>
            <DonutChart
              data={
                data?.patientDistribution.length
                  ? data.patientDistribution.map((d) => ({
                      label: categoryLabels[d._id] || d._id,
                      value: d.count,
                      color: categoryColors[d._id] || 'var(--muted)',
                    }))
                  : [
                      { label: 'Outpatient', value: 0, color: 'var(--accent)' },
                      { label: 'Hospitalized', value: 0, color: 'var(--purple)' },
                      { label: 'External', value: 0, color: 'var(--green)' },
                      { label: 'Emergency', value: 0, color: 'var(--amber)' },
                    ]
              }
              centerLabel={String(mc.patients)}
            />
          </div>
        </Card>
      </div>

      {/* ── Activity Feed ── */}
      <Card>
        <CardHeader
          title="Real-time Activity Log"
          right={
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              Live
            </div>
          }
        />
        {(data?.activityLog.length || 0) === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px', fontSize: '13px' }}>
            No recent activity
          </div>
        ) : (
          <div className={styles.activityGrid}>
            {[0, 1, 2].map((col) => (
              <div key={col}>
                {data?.activityLog
                  .filter((_, i) => i % 3 === col)
                  .map((log) => (
                    <ActivityItem
                      key={log._id}
                      color={log.color}
                      text={
                        <span>
                          {log.action}
                          {log.details && (
                            <>
                              {' — '}
                              <strong style={{ color: log.color }}>{log.details}</strong>
                            </>
                          )}
                          {log.user && (
                            <> by {log.user.firstName} {log.user.lastName}</>
                          )}
                        </span>
                      }
                      time={timeAgo(new Date(log.createdAt))}
                    />
                  ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
