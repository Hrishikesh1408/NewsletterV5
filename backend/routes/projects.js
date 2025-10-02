const express = require('express');
const Project = require('../models/Project');
const Newsletter = require('../models/Newsletter');
const Activity = require('../models/Activity');
const router = express.Router();

function getMonthName(monthNumber) {
  const months = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };
  
  // Handle different month formats
  if (!monthNumber) return 'Unknown';
  
  // Convert to string and pad with zero if needed
  const monthStr = String(monthNumber).padStart(2, '0');
  
  return months[monthStr] || 'Unknown';
}

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    console.log('Creating project with data:', req.body);
    const project = new Project(req.body);
    await project.save();
    console.log('Project saved:', { id: project._id, month: project.month, year: project.year });
    
    // Create newsletter with auto-generated title and intro
    const monthName = getMonthName(project.month);
    const title = `${monthName} ${project.year} Newsletter`;
    console.log('Generated newsletter title:', title, 'from month:', project.month, 'year:', project.year);
    
    // Ensure title is not empty
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
    
    res.json({ success: true, project });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Delete project and all related data
    await Promise.all([
      Project.findByIdAndDelete(projectId),
      Newsletter.deleteOne({ projectId }),
      Activity.deleteMany({ projectId })
    ]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

module.exports = router;