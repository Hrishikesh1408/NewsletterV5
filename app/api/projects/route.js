import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Newsletter from '@/models/Newsletter';
import Activity from '@/models/Activity';

function getMonthName(monthNumber) {
  const months = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };
  
  if (!monthNumber) return 'Unknown';
  
  const monthStr = String(monthNumber).padStart(2, '0');
  return months[monthStr] || 'Unknown';
}

// GET /api/projects
export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    console.log('Creating project with data:', data);

    const project = new Project(data);
    await project.save();
    console.log('Project saved:', { id: project._id, month: project.month, year: project.year });
    
    // Create newsletter with auto-generated title and intro
    const monthName = getMonthName(project.month);
    const title = `${monthName} ${project.year} Newsletter`;
    console.log('Generated newsletter title:', title, 'from month:', project.month, 'year:', project.year);
    
    if (!title || title.trim() === '' || title.includes('undefined') || title.includes('null')) {
      throw new Error(`Invalid title generated: '${title}'. Month: '${project.month}', Year: '${project.year}'`);
    }
    
    const newsletter = new Newsletter({
      projectId: project._id,
      title: title,
      intro: `Welcome to the ${monthName} ${project.year} edition of our newsletter! We're excited to share the latest updates, achievements, and highlights from our team.`,
      editors: {},
      businessTopics: [],
      awards: [],
      spotlight: [],
      joiners: [],
      birthdays: [],
      images: {}
    });
    await newsletter.save();
    
    // Initialize section statuses
    const sections = ['Engineering', 'Business', 'Awards', 'Spotlight', 'HR Updates', 'Events', 'Notes', 'Images'];
    const activities = sections.map(section => ({
      projectId: project._id,
      section,
      status: 'not-started',
      progress: 0
    }));
    await Activity.insertMany(activities);
    
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
