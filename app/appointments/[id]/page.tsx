'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, FileText, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import AppointmentFormModal from '@/components/appointments/AppointmentFormModal';
import { formatDateLong, formatTime } from '@/lib/utils';

interface IntakeData {
  vitals: { weight: string; bloodPressure: string };
  questions: { question: string; answer: string }[];
  takenBy: { firstName: string; lastName: string } | null;
  takenAt: string | null;
}

interface AppointmentDetail {
  _id: string;
  dateTime: string;
  department: string;
  duration: number;
  reason: string;
  status: string;
  notes: string;
  intake: IntakeData | null;
  patient: { _id: string; firstName: string; lastName: string; patientId: string; gender: string; dateOfBirth: string; phone: string } | null;
  doctor: { _id: string; firstName: string; lastName: string; department: string } | null;
  hospital: { _id: string; name: string } | null;
}

export default function AppointmentDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [apt, setApt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchApt = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`);
      const json = await res.json();
      if (json.success) setApt(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApt(); }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/appointments/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchApt();
  };

  const handleDelete = async () => {
    if (!confirm('Cancel this appointment?')) return;
    await fetch(`/api/appointments/${params.id}`, { method: 'DELETE' });
    router.push('/appointments');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Loading...</div>;
  if (!apt) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Appointment not found</div>;

  const intake = apt.intake;
  const hasVitals = intake?.vitals?.weight || intake?.vitals?.bloodPressure;
  const answeredQuestions = intake?.questions?.filter(q => q.answer) || [];
  const isDoctor = session?.user?.role === 'doctor';
  const isFinished = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no-show';

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="secondary" onClick={() => router.push('/appointments')}><ArrowLeft size={14} /> Back to Appointments</Button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 400, marginBottom: '4px' }}>
            Appointment — {apt.department}
          </h1>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', color: 'var(--muted)', alignItems: 'center' }}>
            <StatusBadge status={apt.status} />
            {apt.patient && <span>{apt.patient.firstName} {apt.patient.lastName} ({apt.patient.patientId})</span>}
            {apt.doctor && <span>Dr. {apt.doctor.firstName} {apt.doctor.lastName}</span>}
            <span>{formatDateLong(new Date(apt.dateTime))} at {formatTime(new Date(apt.dateTime))}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!isFinished && apt.status === 'scheduled' && <Button variant="secondary" onClick={() => updateStatus('confirmed')}>Confirm</Button>}
          {!isFinished && apt.status === 'confirmed' && <Button variant="secondary" onClick={() => updateStatus('in-progress')}>Start Consultation</Button>}
          {!isFinished && (apt.status === 'in-progress' || apt.status === 'in-preparation') && <Button onClick={() => updateStatus('completed')}>Complete</Button>}
          {isDoctor && !isFinished && (
            <Button variant="secondary" onClick={() => router.push(`/records?patient=${apt.patient?._id}`)}>
              <FileText size={14} /> Create Record
            </Button>
          )}
          <Button variant="secondary" onClick={() => setEditOpen(true)}><Edit size={14} /> Edit</Button>
          {!isFinished && <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /> Cancel</Button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left: Intake data */}
        <div>
          {/* Intake Vitals */}
          <Card>
            <CardHeader title="Initial Consultation — Intake Data" right={
              hasVitals ? (
                <span style={{ fontSize: '11px', color: 'var(--green)' }}>Completed by reception</span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Pending intake</span>
              )
            } />

            {hasVitals ? (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                {intake?.vitals.weight && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 20px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Weight</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{intake.vitals.weight} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 400 }}>kg</span></div>
                  </div>
                )}
                {intake?.vitals.bloodPressure && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 20px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Blood Pressure</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{intake.vitals.bloodPressure} <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 400 }}>mmHg</span></div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: '13px' }}>
                No intake vitals recorded yet. Reception needs to complete the initial consultation.
              </div>
            )}

            {/* Screening Questions */}
            {answeredQuestions.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  Screening Questions
                </div>
                {answeredQuestions.map((q, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>{q.question}</div>
                    <div style={{ fontWeight: 500 }}>{q.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Notes */}
          {apt.notes && (
            <Card style={{ marginTop: '16px' }}>
              <CardHeader title="Notes" />
              <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{apt.notes}</div>
            </Card>
          )}

          {/* Details */}
          <Card style={{ marginTop: '16px' }}>
            <CardHeader title="Details" />
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Reason</span><span style={{ fontWeight: 500 }}>{apt.reason || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Duration</span><span style={{ fontWeight: 500 }}>{apt.duration} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Department</span><span style={{ fontWeight: 500 }}>{apt.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Hospital</span><span style={{ fontWeight: 500 }}>{apt.hospital?.name || '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Patient + Doctor info */}
        <div>
          {apt.patient && (
            <Card>
              <CardHeader title="Patient" action="View Profile →" onAction={() => router.push(`/patients/${apt.patient?._id}`)} />
              <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{apt.patient.firstName} {apt.patient.lastName}</div>
                <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  {apt.patient.patientId} · {apt.patient.gender === 'male' ? 'Male' : 'Female'} · {apt.patient.phone || 'No phone'}
                </div>
              </div>
            </Card>
          )}

          {apt.doctor && (
            <Card style={{ marginTop: '16px' }}>
              <CardHeader title="Doctor" />
              <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: 500 }}>Dr. {apt.doctor.firstName} {apt.doctor.lastName}</div>
                {apt.doctor.department && <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{apt.doctor.department}</div>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <AppointmentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={fetchApt}
        editData={editOpen ? apt as never : null}
      />
    </div>
  );
}
