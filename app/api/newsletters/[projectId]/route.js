import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Newsletter from '@/models/Newsletter';
import Project from '@/models/Project';
import { verifyAuth, rolePermissions } from '@/lib/auth';
import { compileNewsletterHTML, getDefaultTemplateHtml } from '@/lib/newsletterCompiler';
import TemplateConfig from '@/models/TemplateConfig';

// GET /api/newsletters/[projectId]
export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const newsletter = await Newsletter.findOne({ projectId });
    if (!newsletter) {
      // Return empty structure if no newsletter exists yet
      return NextResponse.json({
        title: '',
        platform: '',
        presales: '',
        qa: '',
        enterprise: '',
        sre: '',
        ownerNotes: '',
        logo: { src: '', alt: '', width: '', alignment: 'center' },
        businessTopics: [],
        awards: [],
        spotlight: [],
        joiners: [],
        birthdays: [],
        sectionImages: {
          activities: [],
          platform: [],
          presales: [],
          qa: [],
          enterprise: [],
          sre: [],
          events: [],
          notes: []
        },
        images: {}
      });
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 });
  }
}

// POST /api/newsletters/[projectId]
export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id: userId, username: userName, role: userRole } = user;
    const body = await request.json();
    const { section, ...updateData } = body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Filter updateData based on user role permissions
    const allowedFields = rolePermissions[userRole] || [];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        let value = updateData[field];
        
        // Parse JSON strings for array fields
        if (['awards', 'businessTopics', 'upcomingEventsList', 'spotlight', 'joiners', 'birthdays', 'sectionImages'].includes(field)) {
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
              if (typeof value === 'string') {
                value = JSON.parse(value);
              }
            } catch (e) {
              console.log(`Failed to parse ${field}:`, e.message);
              value = field === 'sectionImages' ? {} : [];
            }
          }
          if (field === 'sectionImages' && typeof value !== 'object') {
            value = {};
          } else if (field !== 'sectionImages' && !Array.isArray(value)) {
            value = [];
          }
        }
        filteredData[field] = value;
      }
    });

    // For team roles, merge their submitted department awards with other departments' awards
    if (['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(userRole) && filteredData.hasOwnProperty('awards')) {
      const existingNewsletter = await Newsletter.findOne({ projectId });
      const otherDeptsAwards = existingNewsletter && existingNewsletter.awards 
        ? existingNewsletter.awards.filter(a => a.department !== userRole) 
        : [];
      filteredData.awards = [...otherDeptsAwards, ...filteredData.awards];
    }

    // Create change log entry
    const changeLogEntry = {
      userId: userId || null,
      userName: userName || 'Unknown',
      userRole: userRole || 'unknown',
      section: section || 'general',
      action: 'update',
      timestamp: new Date(),
      changes: filteredData
    };

    // Update newsletter with change tracking (temporarily without html so we can compile with the full object)
    let newsletter = await Newsletter.findOneAndUpdate(
      { projectId },
      { 
        ...filteredData, 
        projectId,
        lastModifiedBy: userId,
        $push: { changeLog: changeLogEntry }
      },
      { upsert: true, new: true }
    );

    // Now compile the HTML dynamically using the latest newsletter state
    let templateHtml = '';
    if (newsletter.templateId) {
      const template = await TemplateConfig.findById(newsletter.templateId);
      if (template && template.html) {
        templateHtml = template.html;
      }
    }

    if (!templateHtml) {
      const defaultTemplate = await TemplateConfig.findOne({ isDefault: true });
      templateHtml = defaultTemplate?.html || getDefaultTemplateHtml();
    }

    try {
      newsletter.html = compileNewsletterHTML(templateHtml, newsletter);
      await newsletter.save();
    } catch (err) {
      console.error('Failed to compile newsletter HTML:', err);
    }

    // Update project's updatedAt
    await Project.findByIdAndUpdate(projectId, { lastModified: new Date() });

    return NextResponse.json({ success: true, newsletter });
  } catch (error) {
    console.error('Newsletter save error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save newsletter' }, { status: 500 });
  }
}
