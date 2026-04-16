import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activityLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const doctor = searchParams.get('doctor') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    const view = searchParams.get('view') || ''; // 'today' for dashboard

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (doctor) filter.doctor = doctor;

    if (view === 'today') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      filter.dateTime = { $gte: todayStart, $lt: todayEnd };
    } else if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        dateFilter.$lt = end;
      }
      if (Object.keys(dateFilter).length) filter.dateTime = dateFilter;
    }

    const [data, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patient', 'firstName lastName patientId gender dateOfBirth')
        .populate('doctor', 'firstName lastName')
        .populate('hospital', 'name')
        .sort({ dateTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    // If search, filter populated results (patient name)
    let filtered = data;
    if (search) {
      const s = search.toLowerCase();
      filtered = data.filter((apt: Record<string, unknown>) => {
        const p = apt.patient as Record<string, string> | null;
        if (!p) return false;
        return (
          p.firstName?.toLowerCase().includes(s) ||
          p.lastName?.toLowerCase().includes(s) ||
          p.patientId?.toLowerCase().includes(s)
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: search ? filtered : data,
      pagination: { page, limit, total: search ? filtered.length : total },
    });
  } catch (error) {
    console.error('Appointments GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const appointment = await Appointment.create({
      ...body,
      createdBy: session.user.id,
      hospital: body.hospital || session.user.hospital || null,
    });

    await logActivity({ action: `Appointment in ${body.department}`, module: 'appointment', details: 'scheduled', userId: session.user.id, refId: appointment._id.toString(), color: 'var(--purple)' });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Appointments POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create appointment' }, { status: 500 });
  }
}
