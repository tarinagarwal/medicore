import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const hospitals = await Hospital.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: hospitals });
  } catch (error) {
    console.error('Hospitals GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch hospitals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'Hospital name is required' }, { status: 400 });

    const hospital = await Hospital.create(body);
    return NextResponse.json({ success: true, data: hospital }, { status: 201 });
  } catch (error) {
    console.error('Hospitals POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create hospital' }, { status: 500 });
  }
}
