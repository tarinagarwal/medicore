import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Hospital from '@/models/Hospital';
import { getSession } from '@/lib/session';

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
    const type = searchParams.get('type') || '';
    const patient = searchParams.get('patient') || '';
    const hospital = searchParams.get('hospital') || '';

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (patient) filter.patient = patient;
    if (hospital) filter.hospital = hospital;
    if (search) {
      filter.$or = [
        { recordId: { $regex: search, $options: 'i' } },
        { 'content.diagnosis': { $regex: search, $options: 'i' } },
        { 'content.chiefComplaint': { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('patient', 'firstName lastName patientId')
        .populate('doctor', 'firstName lastName')
        .populate('hospital', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MedicalRecord.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Records GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Find the highest record number for the current year
    const year = new Date().getFullYear();
    const lastRecords = await MedicalRecord.find({ recordId: { $regex: `^R-${year}-` } })
      .select('recordId')
      .sort({ recordId: -1 })
      .limit(1)
      .lean() as { recordId?: string }[];
    
    let seq = 1;
    if (lastRecords.length > 0 && lastRecords[0].recordId) {
      const parts = lastRecords[0].recordId.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const recordId = `R-${year}-${String(seq).padStart(4, '0')}`;

    const record = await MedicalRecord.create({
      ...body,
      recordId,
      doctor: session.user.id,
      hospital: body.hospital && body.hospital !== '' ? body.hospital : (session.user.hospital || null),
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Records POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create record' }, { status: 500 });
  }
}
