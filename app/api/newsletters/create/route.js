import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Newsletter from '@/models/Newsletter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    
    const newsletter = new Newsletter({
      title: body.title || 'New Newsletter',
      projectId: body.projectId,
      platform: '',
      presales: '',
      qa: '',
      enterprise: '',
      sre: '',
      ownerNotes: ''
    });
    
    await newsletter.save();
    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Newsletter creation error:', error);
    return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 });
  }
}
