import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { parseHTMLTemplate } from '@/lib/templateParser';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    let existingDefault = await TemplateConfig.findOne({ isDefault: true });

    const templatePath = path.join(process.cwd(), 'turbify-newsletter-template.html');
    let finalConfig = TemplateConfig.getDefaultConfig();

    try {
      if (fs.existsSync(templatePath)) {
        const htmlContent = fs.readFileSync(templatePath, 'utf8');
        const parsed = parseHTMLTemplate(htmlContent, 'Turbify Template Layout', 'Default layout for Turbify');
        finalConfig = {
          name: parsed.name,
          description: parsed.description,
          isDefault: true,
          sections: parsed.sections,
          html: parsed.html
        };
      }
    } catch (err) {
      console.error('Failed to parse turbify-newsletter-template.html, falling back to basic default', err);
    }

    if (existingDefault) {
      // Update the existing default template instead of creating a new one
      existingDefault.name = finalConfig.name;
      existingDefault.description = finalConfig.description;
      existingDefault.sections = finalConfig.sections;
      existingDefault.html = finalConfig.html;
      existingDefault.lastModifiedBy = user.id;
      await existingDefault.save();
      await existingDefault.populate('createdBy', 'firstName email');
      await existingDefault.populate('lastModifiedBy', 'firstName email');
      return NextResponse.json({ success: true, message: 'Default template updated', template: existingDefault });
    }

    const template = new TemplateConfig({
      ...finalConfig,
      createdBy: user.id,
      lastModifiedBy: user.id
    });

    await template.save();
    await template.populate('createdBy', 'firstName email');
    await template.populate('lastModifiedBy', 'firstName email');

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error('Error initializing default template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
