import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Hospital from '@/models/Hospital';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activityLog';

// GET /api/patients — list with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Ensure Hospital model is registered
    Hospital;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const hospital = searchParams.get('hospital') || '';

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (hospital) filter.hospital = hospital;

    const [data, total] = await Promise.all([
      Patient.find(filter)
        .populate('hospital', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Patients GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch patients' }, { status: 500 });
  }
}

// POST /api/patients — create new patient (admin + receptionist)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'admin' && session.user.role !== 'receptionist') {
      return NextResponse.json({ success: false, message: 'Only administrators and receptionists can register patients' }, { status: 403 });
    }

    const body = await request.json();

    // Find the highest patient number for the current year
    const year = new Date().getFullYear();
    const lastPatients = await Patient.find({ patientId: { $regex: `^P-${year}-` } })
      .select('patientId')
      .sort({ patientId: -1 })
      .limit(1)
      .lean() as { patientId?: string }[];
    
    let seq = 1;
    if (lastPatients.length > 0 && lastPatients[0].patientId) {
      const parts = lastPatients[0].patientId.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const patientId = `P-${year}-${String(seq).padStart(4, '0')}`;

    const patient = await Patient.create({
      ...body,
      patientId,
      hospital: body.hospital && body.hospital !== '' ? body.hospital : (session.user.hospital || null),
      createdBy: session.user.id,
    });

    await logActivity({ action: `Patient ${body.firstName} ${body.lastName}`, module: 'patient', details: 'registered', userId: session.user.id, refId: patient._id.toString(), color: 'var(--accent)' });

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error) {
    console.error('Patients POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create patient' }, { status: 500 });
  }
}
