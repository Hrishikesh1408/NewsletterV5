import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';
import { parseHTMLTemplate } from '@/lib/templateParser';

// GET /api/templates
export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const templates = await TemplateConfig.find()
      .populate('createdBy', 'firstName email')
      .populate('lastModifiedBy', 'firstName email')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/templates
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { name, description, sections, html } = body;

    let finalSections = sections;
    let finalHtml = html || '';

    if (html) {
      try {
        const parsed = parseHTMLTemplate(html, name, description);
        finalSections = parsed.sections;
        finalHtml = parsed.html;
      } catch (err) {
        console.error('Failed to parse uploaded HTML template:', err);
        // Fallback to defaults or raw html
      }
    }

    const template = new TemplateConfig({
      name,
      description,
      sections: finalSections || TemplateConfig.getDefaultConfig().sections,
      html: finalHtml,
      createdBy: user.id,
      lastModifiedBy: user.id
    });

    await template.save();
    await template.populate('createdBy', 'firstName email');
    await template.populate('lastModifiedBy', 'firstName email');

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
