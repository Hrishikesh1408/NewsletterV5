import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const template = await TemplateConfig.findOne({ isDefault: true }).lean();
    if (!template) {
      return NextResponse.json({ success: false, error: 'No active template found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching active template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
