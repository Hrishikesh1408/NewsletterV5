import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/templates/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid template ID format' }, { status: 400 });
    }

    await dbConnect();
    const template = await TemplateConfig.findById(id)
      .populate('createdBy', 'firstName email')
      .populate('lastModifiedBy', 'firstName email')
      .lean();

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/templates/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid template ID format' }, { status: 400 });
    }

    await dbConnect();
    const body = await request.json();
    const { name, description, sections, html } = body;

    const template = await TemplateConfig.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    template.name = name || template.name;
    template.description = description || template.description;
    template.sections = sections || template.sections;
    if (html !== undefined) {
      template.html = html;
    }
    template.lastModifiedBy = user.id;

    await template.save();
    await template.populate('createdBy', 'firstName email');
    await template.populate('lastModifiedBy', 'firstName email');

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid template ID format' }, { status: 400 });
    }

    await dbConnect();
    const template = await TemplateConfig.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    if (template.isDefault) {
      return NextResponse.json({ success: false, error: 'Cannot delete default template' }, { status: 400 });
    }

    await TemplateConfig.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
