import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Newsletter from '@/models/Newsletter';
import Activity from '@/models/Activity';

// PUT /api/projects/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    const data = await request.json();

    const project = await Project.findByIdAndUpdate(id, data, { new: true });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    await Promise.all([
      Project.findByIdAndDelete(id),
      Newsletter.deleteOne({ projectId: id }),
      Activity.deleteMany({ projectId: id })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
