import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LabRequest from '@/models/LabRequest';
import Hospital from '@/models/Hospital';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activityLog';

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
    const status = searchParams.get('status') || '';
    const patient = searchParams.get('patient') || '';
    const hospital = searchParams.get('hospital') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (patient) filter.patient = patient;
    if (hospital) filter.hospital = hospital;
    if (search) {
      filter.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { 'tests.name': { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      LabRequest.find(filter)
        .populate('patient', 'firstName lastName patientId')
        .populate('doctor', 'firstName lastName')
        .populate('hospital', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LabRequest.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Lab GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch lab requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Find the highest request number for the current year
    const year = new Date().getFullYear();
    const lastRequests = await LabRequest.find({ requestId: { $regex: `^L-${year}-` } })
      .select('requestId')
      .sort({ requestId: -1 })
      .limit(1)
      .lean() as { requestId?: string }[];
    
    let seq = 1;
    if (lastRequests.length > 0 && lastRequests[0].requestId) {
      const parts = lastRequests[0].requestId.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const requestId = `L-${year}-${String(seq).padStart(4, '0')}`;

    const labRequest = await LabRequest.create({
      ...body,
      requestId,
      doctor: body.doctor || session.user.id,
      hospital: body.hospital && body.hospital !== '' ? body.hospital : (session.user.hospital || null),
    });

    await logActivity({ action: `Lab request ${requestId}`, module: 'lab', details: 'created', userId: session.user.id, refId: labRequest._id.toString(), color: 'var(--accent2)' });

    return NextResponse.json({ success: true, data: labRequest }, { status: 201 });
  } catch (error) {
    console.error('Lab POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create lab request' }, { status: 500 });
  }
}
