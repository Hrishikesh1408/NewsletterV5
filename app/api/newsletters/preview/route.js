import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import { compileNewsletterHTML } from '@/lib/newsletterCompiler';
import TemplateConfig from '@/models/TemplateConfig';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const defaultTemplate = await TemplateConfig.findOne({ isDefault: true });
    const templateHtml = defaultTemplate ? defaultTemplate.html : '';

    if (!templateHtml) {
      return NextResponse.json({ error: 'No default template found' }, { status: 404 });
    }

    const compiledHtml = compileNewsletterHTML(templateHtml, body);
    console.log('Preview API called. Body has joiners?', body.joiners && body.joiners.length > 0);
    console.log('Template has {{joiners}}?', templateHtml.includes('{{joiners}}'));
    console.log('Compiled HTML has New Joiners?', compiledHtml.includes('Welcome New Joiners'));

    return NextResponse.json({ success: true, html: compiledHtml });
  } catch (error) {
    console.error('Preview compilation error:', error);
    return NextResponse.json({ error: 'Failed to compile preview' }, { status: 500 });
  }
}
