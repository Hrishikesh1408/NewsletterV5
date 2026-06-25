import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No image files provided' }, { status: 400 });
    }

    const images = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          data: `data:${file.type};base64,${buffer.toString('base64')}`,
          filename: file.name,
          size: file.size
        };
      })
    );

    return NextResponse.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Images upload error:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}
