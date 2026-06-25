import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Newsletter from '@/models/Newsletter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const newsletter = await Newsletter.findOne({ projectId });
    if (!newsletter || !newsletter.html) {
      return NextResponse.json({ html: null, message: 'No newsletter HTML found. Please generate one first.' });
    }

    return NextResponse.json({ html: newsletter.html });
  } catch (error) {
    console.error('HTML generation fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve HTML' }, { status: 500 });
  }
}
