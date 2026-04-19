import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import { getSession } from '@/lib/session';

// GET /api/settings/config - Get all system configurations
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const key = searchParams.get('key');

    if (key) {
      // Get specific config
      const config = await SystemConfig.findOne({ key, isActive: true }).lean();
      return NextResponse.json({ success: true, data: config });
    }

    // Get all configs
    const configs = await SystemConfig.find({ isActive: true }).sort({ key: 1 }).lean();
    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch configurations' }, { status: 500 });
  }
}

// POST /api/settings/config - Create or update system configuration (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { key, label, values } = body;

    if (!key || !label || !values) {
      return NextResponse.json({ success: false, message: 'Key, label, and values are required' }, { status: 400 });
    }

    // Upsert configuration
    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { key, label, values, isActive: true },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save configuration' }, { status: 500 });
  }
}
