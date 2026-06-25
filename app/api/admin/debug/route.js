import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TemplateConfig from '@/models/TemplateConfig';

export async function GET() {
  await dbConnect();
  const existingDefault = await TemplateConfig.findOne({ isDefault: true });
  return NextResponse.json({ sections: existingDefault ? existingDefault.sections : [] });
}
