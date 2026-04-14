'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, CalendarPlus, Clock } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatTime } from '@/lib/utils';
import s from '@/styles/role-dashboards.module.css';

interface QueueItem {
  _id: string;
  patient: { firstName: string; lastName: string; patientId: string } | null;
  department: string;
  dateTime: string;
  status: string;
  reason: string;
  intake: { vitals: { weight: string; bloodPressure: string } } | null;
}

export default function ReceptionistDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });

  useEffect(() => {
    fetch('/api/appointments?view=today&limit=50')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setQueue(j.data);
          const total = j.data.length;
          const waiting = j.data.filter((a: QueueItem) => ['scheduled', 'confirmed'].includes(a.status)).length;
          const completed = j.data.filter((a: QueueItem) => a.status === 'completed').length;
          setStats({ total, waiting, completed });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasIntake = (apt: QueueItem) => apt.intake?.vitals?.weight || apt.intake?.vitals?.bloodPressure;

  return (
    <div>
      {/* Role Banner */}
      <div className={`${s.roleBanner} ${s.roleBannerReception}`}>
        <div className={s.roleIcon} style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent2)' }}>
          <Clock size={16} />
        </div>
        <div className={s.roleLabel}>Reception Mode</div>
        <div className={s.roleUser}>{userName}</div>
      </div>

      {/* Welcome */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '4px' }}>
          Welcome, {userName.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          Manage today&apos;s patient queue, register new patients, and complete intake assessments.
        </p>
      </div>

      {/* Quick Actions */}
      <div className={s.quickActions}>
        <div className={s.quickAction} onClick={() => router.push('/appointments')}>
          <div className={s.quickActionIcon} style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--accent2)' }}>
            <CalendarPlus size={24} />
          </div>
          <div>
            <div className={s.quickActionTitle}>Book Appointment</div>
            <div className={s.quickActionDesc}>Schedule a new appointment, register patient, and take vitals</div>
          </div>
        </div>
        <div className={s.quickAction} onClick={() => router.push('/appointments')}>
          <div className={s.quickActionIcon} style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <div className={s.quickActionTitle}>Register & Book</div>
            <div className={s.quickActionDesc}>New patient? Register them and book their first appointment</div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Today&apos;s Appointments</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent)' }}>{stats.total}</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Waiting</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--amber)' }}>{stats.waiting}</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Completed</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--green)' }}>{stats.completed}</div>
        </Card>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader title="Today's Queue" right={<span style={{ fontSize: '12px', color: 'var(--muted)' }}>{queue.length} appointment{queue.length !== 1 ? 's' : ''}</span>} />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading queue...</div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>No appointments scheduled for today</div>
        ) : (
          queue.map((apt, i) => (
            <div key={apt._id} className={s.queueItem} onClick={() => router.push(`/appointments/${apt._id}`)} style={{ cursor: 'pointer' }}>
              <div className={s.queueNumber}>{i + 1}</div>
              <div className={s.queueInfo}>
                <div className={s.queueName}>
                  {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Unknown'}
                </div>
                <div className={s.queueMeta}>
                  {formatTime(new Date(apt.dateTime))} · {apt.department} · {apt.reason || 'No reason'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasIntake(apt) ? (
                  <span style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                    Intake done
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Needs intake</span>
                )}
                <StatusBadge status={apt.status} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
