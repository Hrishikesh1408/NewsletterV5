const express = require('express');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const router = express.Router();

// Get status for project
router.get('/status/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const activities = await Activity.find({ projectId });
    const status = {};
    
    // Initialize default sections if no activities exist
    const defaultSections = ['Engineering', 'Business', 'Awards', 'Spotlight', 'HR Updates', 'Events', 'Notes', 'Images'];
    defaultSections.forEach(section => {
      status[section] = { status: 'not-started', progress: 0 };
    });
    
    // Override with actual data
    activities.forEach(activity => {
      status[activity.section] = {
        status: activity.status,
        progress: activity.progress,
        lastModified: activity.updatedAt
      };
    });
    
    res.json(status);
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Get changes/activities
router.get('/changes/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    const changes = await Activity.find({ projectId })
      .sort({ updatedAt: -1 })
      .limit(50); // Limit to recent 50 changes
    
    // Format for frontend
    const formattedChanges = changes.map(change => ({
      section: change.section,
      status: change.status,
      timestamp: change.updatedAt,
      progress: change.progress
    }));
    
    res.json(formattedChanges);
  } catch (error) {
    console.error('Changes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

// Track change
router.post('/track-change', async (req, res) => {
  try {
    const { projectId, section, status } = req.body;
    
    if (!projectId || !section || !status) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const progress = status === 'completed' ? 100 : status === 'in-progress' ? 50 : 0;
    
    await Activity.findOneAndUpdate(
      { projectId, section },
      { status, progress, timestamp: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track change error:', error);
    res.status(500).json({ success: false, error: 'Failed to track change' });
  }
});

// Update status (alias for track-change)
router.post('/update-status', async (req, res) => {
  try {
    const { projectId } = req.body;
    const statusUpdates = req.body;
    
    // Remove projectId from updates object
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
    res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

module.exports = router;