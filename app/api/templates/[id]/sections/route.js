import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { parentId, section } = body;
    const template = await TemplateConfig.findById(id);

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const newSection = {
      id: section.id || `section-${Date.now()}`,
      title: section.title,
      enabled: section.enabled !== undefined ? section.enabled : true,
      headingOnly: section.headingOnly !== undefined ? section.headingOnly : false,
      color: section.color || '#f97316',
      order: section.order || 0,
      content: section.content || '',
      children: []
    };

    if (parentId) {
      // Add to parent section
      const addToParent = (sections) => {
        for (let s of sections) {
          if (s.id === parentId) {
            if (!s.children) s.children = [];
            s.children.push(newSection);
            return true;
          }
          if (s.children && addToParent(s.children)) {
            return true;
          }
        }
        return false;
      };

      if (!addToParent(template.sections)) {
        return NextResponse.json({ success: false, error: 'Parent section not found' }, { status: 404 });
      }
    } else {
      // Add as root section
      template.sections.push(newSection);
    }

    template.lastModifiedBy = user.id;
    await template.save();

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error adding section:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
