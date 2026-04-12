import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import MedicalRecord from '@/models/MedicalRecord';
import LabRequest from '@/models/LabRequest';
import ImagingStudy from '@/models/ImagingStudy';
import Invoice from '@/models/Invoice';
import { getSession } from '@/lib/session';

// GET /api/patients/[id] — get single patient with related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const patient = await Patient.findById(id).lean();
    if (!patient) return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });

    // Fetch related data
    const [appointments, records, labRequests, imagingStudies, invoices] = await Promise.all([
      Appointment.find({ patient: id }).populate('doctor', 'firstName lastName').sort({ dateTime: -1 }).limit(20).lean(),
      MedicalRecord.find({ patient: id }).populate('doctor', 'firstName lastName').sort({ createdAt: -1 }).limit(20).lean(),
      LabRequest.find({ patient: id }).sort({ createdAt: -1 }).limit(20).lean(),
      ImagingStudy.find({ patient: id }).sort({ createdAt: -1 }).limit(20).lean(),
      Invoice.find({ patient: id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: { patient, appointments, records, labRequests, imagingStudies, invoices },
    });
  } catch (error) {
    console.error('Patient GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch patient' }, { status: 500 });
  }
}

// PUT /api/patients/[id] — update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Only admin can edit patients. Doctors have read-only access.
    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Only administrators can edit patient data' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const patient = await Patient.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!patient) return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Patient PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update patient' }, { status: 500 });
  }
}

// DELETE /api/patients/[id] — soft delete (set status to discharged), admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    if (session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Only administrators can discharge patients' }, { status: 403 });
    }

    const { id } = await params;
    const patient = await Patient.findByIdAndUpdate(id, { status: 'discharged' }, { new: true }).lean();
    if (!patient) return NextResponse.json({ success: false, message: 'Patient not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Patient DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete patient' }, { status: 500 });
  }
}
