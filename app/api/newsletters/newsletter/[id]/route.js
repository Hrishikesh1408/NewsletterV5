import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Newsletter from '@/models/Newsletter';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth, rolePermissions } from '@/lib/auth';
import { compileNewsletterHTML, getDefaultTemplateHtml } from '@/lib/newsletterCompiler';

// GET /api/newsletters/newsletter/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 });
  }
}

// PUT /api/newsletters/newsletter/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { role, id: userId } = user;
    const allowedFields = rolePermissions[role] || [];
    const body = await request.json();

    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    let hasUpdates = false;
    allowedFields.forEach(field => {
      if (body.hasOwnProperty(field)) {
        newsletter[field] = body[field];
        hasUpdates = true;
      }
    });

    if (!hasUpdates) {
      return NextResponse.json({ error: 'Forbidden: No allowed fields to update' }, { status: 403 });
    }

    newsletter.lastModifiedBy = userId;

    // Compile dynamic HTML based on the template
    let templateHtml = '';
    if (newsletter.templateId) {
      const template = await TemplateConfig.findById(newsletter.templateId);
      if (template && template.html) {
        templateHtml = template.html;
      }
    }

    if (!templateHtml) {
      templateHtml = getDefaultTemplateHtml();
    }

    try {
      newsletter.html = compileNewsletterHTML(templateHtml, newsletter);
    } catch (err) {
      console.error('Failed to compile newsletter HTML:', err);
    }

    await newsletter.save();

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Newsletter update error:', error);
    return NextResponse.json({ error: 'Failed to update newsletter: ' + error.message }, { status: 500 });
  }
}
