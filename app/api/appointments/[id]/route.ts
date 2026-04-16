import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { getSession } from '@/lib/session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const appointment = await Appointment.findById(id)
      .populate('patient', 'firstName lastName patientId gender dateOfBirth phone')
      .populate('doctor', 'firstName lastName department')
      .populate('hospital', 'name')
      .lean();

    if (!appointment) return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Appointment GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const appointment = await Appointment.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName')
      .populate('hospital', 'name')
      .lean();

    if (!appointment) return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Appointment PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const appointment = await Appointment.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true }).lean();

    if (!appointment) return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Appointment DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to cancel appointment' }, { status: 500 });
  }
}
