import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const hospital = await Hospital.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!hospital) return NextResponse.json({ success: false, message: 'Hospital not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: hospital });
  } catch (error) {
    console.error('Hospital PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update hospital' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });

    const { id } = await params;
    await Hospital.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ success: true, message: 'Hospital deactivated' });
  } catch (error) {
    console.error('Hospital DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to deactivate hospital' }, { status: 500 });
  }
}
