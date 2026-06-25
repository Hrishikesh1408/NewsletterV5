import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { sections } = body;
    const template = await TemplateConfig.findById(id);

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    template.sections = sections;
    template.lastModifiedBy = user.id;
    await template.save();

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error reordering sections:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
