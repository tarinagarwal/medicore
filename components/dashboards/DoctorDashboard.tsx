'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, FileText, CalendarDays } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { getInitials, formatTime, formatDateShort } from '@/lib/utils';
import s from '@/styles/role-dashboards.module.css';

interface IncomingPatient {
  _id: string;
  patient: { _id: string; firstName: string; lastName: string; patientId: string; gender: string; dateOfBirth: string } | null;
  department: string;
  dateTime: string;
  status: string;
  reason: string;
  intake: {
    vitals: { weight: string; bloodPressure: string };
    questions: { question: string; answer: string }[];
  } | null;
}

const avatarColors = [
  { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent)' },
  { bg: 'rgba(139,92,246,0.15)', color: 'var(--purple)' },
  { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
  { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
];

export default function DoctorDashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingPatient[]>([]);
  const [schedule, setSchedule] = useState<IncomingPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments?view=today&limit=50')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          const all = j.data as IncomingPatient[];
          // Incoming = have intake data, not yet completed
          setIncoming(all.filter(a =>
            (a.intake?.vitals?.weight || a.intake?.vitals?.bloodPressure) &&
            !['completed', 'cancelled', 'no-show'].includes(a.status)
          ));
          // Schedule = all today not cancelled
          setSchedule(all.filter(a => a.status !== 'cancelled'));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getAge = (dob: string) => new Date().getFullYear() - new Date(dob).getFullYear();

  return (
    <div>
      {/* Role Banner */}
      <div className={`${s.roleBanner} ${s.roleBannerDoctor}`}>
        <div className={s.roleIcon} style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>
          <Stethoscope size={16} />
        </div>
        <div className={s.roleLabel}>Doctor Mode</div>
        <div className={s.roleUser}>{userName}</div>
      </div>

      {/* Welcome */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '24px', fontWeight: 400, marginBottom: '4px' }}>
          Good morning, Dr. {userName.split(' ')[1] || userName.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          {incoming.length > 0
            ? `You have ${incoming.length} patient${incoming.length > 1 ? 's' : ''} waiting with intake data from reception.`
            : 'No patients with intake data yet. Waiting for reception to send patients.'}
        </p>
      </div>

      {/* Incoming Patients from Reception */}
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500 }}>
          Incoming Patients
          {incoming.length > 0 && (
            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--green)', fontWeight: 400 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', marginRight: '4px', animation: 'pulse 1.5s infinite' }} />
              {incoming.length} ready
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>
      ) : incoming.length === 0 ? (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '13px' }}>
            No patients with intake data yet. Reception will send patients here after initial consultation.
          </div>
        </Card>
      ) : (
        <div className={s.incomingGrid}>
          {incoming.map((apt, i) => {
            const p = apt.patient;
            const c = avatarColors[i % avatarColors.length];
            const answeredQ = apt.intake?.questions?.filter(q => q.answer) || [];

            return (
              <div key={apt._id} className={s.incomingCard} onClick={() => router.push(`/appointments/${apt._id}`)}>
                <div className={s.incomingHeader}>
                  <div className={s.incomingAvatar} style={{ background: c.bg, color: c.color }}>
                    {p ? getInitials(p.firstName, p.lastName) : '??'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={s.incomingName}>{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</div>
                    <div className={s.incomingDept}>
                      {apt.department} · {formatTime(new Date(apt.dateTime))}
                      {p?.dateOfBirth && ` · ${p.gender === 'male' ? 'M' : 'F'}, ${getAge(p.dateOfBirth)} yrs`}
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                {/* Vitals */}
                <div className={s.vitalsRow}>
                  <div className={s.vitalChip}>
                    <div className={s.vitalChipLabel}>Weight</div>
                    <div className={s.vitalChipValue}>{apt.intake?.vitals.weight || '—'} <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>kg</span></div>
                  </div>
                  <div className={s.vitalChip}>
                    <div className={s.vitalChipLabel}>Blood Pressure</div>
                    <div className={s.vitalChipValue}>{apt.intake?.vitals.bloodPressure || '—'} <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>mmHg</span></div>
                  </div>
                </div>

                {/* Screening Answers */}
                {answeredQ.length > 0 && (
                  <div className={s.questionsPreview}>
                    {answeredQ.slice(0, 2).map((q, qi) => (
                      <div key={qi} className={s.questionItem}>
                        <span className={s.questionLabel}>{q.question}</span>
                        <span className={s.questionAnswer}>{q.answer}</span>
                      </div>
                    ))}
                    {answeredQ.length > 2 && <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>+{answeredQ.length - 2} more</div>}
                  </div>
                )}

                {/* Action hint */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button style={{ flex: 1, background: 'rgba(139,92,246,0.12)', color: 'var(--purple)', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'var(--font)' }}
                    onClick={(e) => { e.stopPropagation(); router.push(`/appointments/${apt._id}`); }}>
                    <Stethoscope size={13} /> Start Diagnosis
                  </button>
                  <button style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'var(--font)' }}
                    onClick={(e) => { e.stopPropagation(); router.push(`/records`); }}>
                    <FileText size={13} /> Create Record
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Schedule */}
      <div className={s.scheduleGrid}>
        <Card>
          <CardHeader title="Today's Schedule" right={<span style={{ fontSize: '12px', color: 'var(--muted)' }}>{schedule.length} appointment{schedule.length !== 1 ? 's' : ''}</span>} />
          {schedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '13px' }}>No appointments today</div>
          ) : (
            schedule.map((apt) => (
              <div key={apt._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => router.push(`/appointments/${apt._id}`)}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', width: '40px' }}>{formatTime(new Date(apt.dateTime))}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Unknown'}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{apt.department} — {apt.reason || 'No reason'}</div>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Stats" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Patients Today</span>
              <span style={{ fontWeight: 500 }}>{schedule.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>With Intake Data</span>
              <span style={{ fontWeight: 500, color: 'var(--green)' }}>{incoming.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Completed</span>
              <span style={{ fontWeight: 500 }}>{schedule.filter(a => a.status === 'completed').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Remaining</span>
              <span style={{ fontWeight: 500, color: 'var(--amber)' }}>{schedule.filter(a => !['completed', 'cancelled', 'no-show'].includes(a.status)).length}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => router.push('/appointments')}
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500 }}>
              <CalendarDays size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              View Full Schedule
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
