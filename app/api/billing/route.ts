import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
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
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const hospital = searchParams.get('hospital') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (hospital) filter.hospital = hospital;
    if (search) {
      filter.$or = [{ invoiceId: { $regex: search, $options: 'i' } }];
    }
    if (dateFrom || dateTo) {
      const df: Record<string, Date> = {};
      if (dateFrom) df.$gte = new Date(dateFrom);
      if (dateTo) { const e = new Date(dateTo); e.setDate(e.getDate() + 1); df.$lt = e; }
      if (Object.keys(df).length) filter.createdAt = df;
    }

    const [data, total] = await Promise.all([
      Invoice.find(filter)
        .populate('patient', 'firstName lastName patientId')
        .populate('hospital', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    // Find the highest invoice number for the current year
    const year = new Date().getFullYear();
    const lastInvoices = await Invoice.find({ invoiceId: { $regex: `^F-${year}-` } })
      .select('invoiceId')
      .sort({ invoiceId: -1 })
      .limit(1)
      .lean() as { invoiceId?: string }[];
    
    let seq = 1;
    if (lastInvoices.length > 0 && lastInvoices[0].invoiceId) {
      const parts = lastInvoices[0].invoiceId.split('-');
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const invoiceId = `F-${year}-${String(seq).padStart(4, '0')}`;

    const totalAmount = (body.items || []).reduce((s: number, i: { amount: number }) => s + (i.amount || 0), 0);

    const invoice = await Invoice.create({ 
      ...body, 
      invoiceId, 
      totalAmount, 
      paidAmount: 0, 
      status: 'unpaid', 
      payments: [], 
      createdBy: session.user.id,
      hospital: body.hospital && body.hospital !== '' ? body.hospital : (session.user.hospital || null),
    });

    await logActivity({ action: `Invoice ${invoiceId}`, module: 'billing', details: `created — ${totalAmount} MAD`, userId: session.user.id, refId: invoice._id.toString(), color: 'var(--accent2)' });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create invoice' }, { status: 500 });
  }
}
