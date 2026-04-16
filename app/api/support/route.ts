import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportRequest from '@/models/SupportRequest';
import { getSession } from '@/lib/session';

// GET - Admin only
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const requests = await SupportRequest.find(filter)
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Support GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch support requests' }, { status: 500 });
  }
}

// POST - Public (no auth required)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const supportRequest = await SupportRequest.create(body);
    return NextResponse.json({ success: true, data: supportRequest }, { status: 201 });
  } catch (error) {
    console.error('Support POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit request' }, { status: 500 });
  }
}
