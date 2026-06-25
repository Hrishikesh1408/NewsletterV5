import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Activity from '@/models/Activity';
import Project from '@/models/Project';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { projectId, section, status } = body;

    if (!projectId || !section || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const progress = status === 'completed' ? 100 : status === 'in-progress' ? 50 : 0;

    await Activity.findOneAndUpdate(
      { projectId, section },
      { status, progress, timestamp: new Date() },
      { _id: false, upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track change error:', error);
    return NextResponse.json({ success: false, error: 'Failed to track change' }, { status: 500 });
  }
}
