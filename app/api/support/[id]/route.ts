import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportRequest from '@/models/SupportRequest';
import { getSession } from '@/lib/session';

// PATCH - Admin only (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.status === 'resolved' || body.status === 'closed') {
      body.resolvedBy = session.user.id;
      body.resolvedAt = new Date();
    }

    const updated = await SupportRequest.findByIdAndUpdate(id, body, { new: true }).lean();
    
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Support PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update request' }, { status: 500 });
  }
}

// DELETE - Admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    await SupportRequest.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    console.error('Support DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete request' }, { status: 500 });
  }
}
