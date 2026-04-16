import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PharmacyItem from '@/models/PharmacyItem';
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
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const hospital = searchParams.get('hospital') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (hospital) filter.hospital = hospital;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      PharmacyItem.find(filter)
        .populate('hospital', 'name')
        .sort({ status: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PharmacyItem.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Pharmacy GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch pharmacy items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Auto-compute status based on quantity and threshold
    if (body.quantity !== undefined && body.minThreshold !== undefined) {
      if (body.quantity <= 0) body.status = 'out-of-stock';
      else if (body.quantity <= body.minThreshold) body.status = 'low-stock';
      else body.status = 'in-stock';
    }

    const item = await PharmacyItem.create({
      ...body,
      hospital: body.hospital && body.hospital !== '' ? body.hospital : (session.user.hospital || null),
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Pharmacy POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create pharmacy item' }, { status: 500 });
  }
}
