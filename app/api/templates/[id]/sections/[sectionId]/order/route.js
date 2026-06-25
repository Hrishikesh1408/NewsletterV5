import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id, sectionId } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { order } = body;

    const template = await TemplateConfig.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const updateSectionOrder = (sections) => {
      for (let section of sections) {
        if (section.id === sectionId) {
          section.order = order;
          return true;
        }
        if (section.children && updateSectionOrder(section.children)) {
          return true;
        }
      }
      return false;
    };

    if (!updateSectionOrder(template.sections)) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    template.lastModifiedBy = user.id;
    await template.save();

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error updating section order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
