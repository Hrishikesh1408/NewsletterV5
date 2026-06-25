import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Activity from '@/models/Activity';

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    await dbConnect();

    const changes = await Activity.find({ projectId })
      .sort({ updatedAt: -1 })
      .limit(50);

    const formattedChanges = changes.map(change => ({
      section: change.section,
      status: change.status,
      timestamp: change.updatedAt,
      progress: change.progress
    }));

    return NextResponse.json(formattedChanges);
  } catch (error) {
    console.error('Changes fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 });
  }
}
