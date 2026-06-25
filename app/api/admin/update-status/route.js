import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Activity from '@/models/Activity';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { projectId } = body;

    const statusUpdates = { ...body };
    delete statusUpdates.projectId;

    const promises = Object.keys(statusUpdates).map(section => {
      const { status, progress } = statusUpdates[section];
      return Activity.findOneAndUpdate(
        { projectId, section },
        { status, progress, timestamp: new Date() },
        { upsert: true, new: true }
      );
    });

    await Promise.all(promises);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
  }
}
