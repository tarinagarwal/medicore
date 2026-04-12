import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const role = searchParams.get('role') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;

    const data = await User.find(filter).populate('hospital', 'name').sort({ createdAt: -1 }).limit(limit).lean();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 });
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
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
      return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
    }

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });

    const hashedPassword = await hash(body.password, 12);
    const user = await User.create({ ...body, email: body.email.toLowerCase(), password: hashedPassword });

    return NextResponse.json({ success: true, data: { ...user.toObject(), password: undefined } }, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
  }
}
