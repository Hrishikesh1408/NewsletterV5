import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Activity from '@/models/Activity';
import Project from '@/models/Project';

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    await dbConnect();

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const activities = await Activity.find({ projectId });
    const status = {};

    const defaultSections = ['Engineering', 'Business', 'Awards', 'Spotlight', 'HR Updates', 'Events', 'Notes', 'Images'];
    defaultSections.forEach(section => {
      status[section] = { status: 'not-started', progress: 0 };
    });

    activities.forEach(activity => {
      status[activity.section] = {
        status: activity.status,
        progress: activity.progress,
        lastModified: activity.updatedAt
      };
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
