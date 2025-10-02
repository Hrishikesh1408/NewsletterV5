const express = require('express');
const Newsletter = require('../models/Newsletter');
const Project = require('../models/Project');
const rolePermissions = require('../rolePermissions');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

// Get newsletter by ID with role-based filtering
router.get('/newsletter/:id', authMiddleware, async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    const { role } = req.user;
    
    // Return full data but let frontend handle role-based visibility
    res.json(newsletter);
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Get newsletter data
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const newsletter = await Newsletter.findOne({ projectId: req.params.projectId });
    if (!newsletter) {
      // Return empty structure if no newsletter exists
      return res.json({
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
    // Return full data - frontend handles role visibility
    res.json(newsletter);
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Save newsletter data
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { section, ...updateData } = req.body;
    const { id: userId, username: userName, role: userRole } = req.user;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Filter updateData based on user role permissions
    const allowedFields = rolePermissions[userRole] || [];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        let value = updateData[field];
        // Parse JSON strings for array fields
        if (['awards', 'businessTopics', 'spotlight', 'joiners', 'birthdays', 'sectionImages'].includes(field)) {
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
              // Handle double-stringified data
              if (typeof value === 'string') {
                value = JSON.parse(value);
              }
            } catch (e) {
              console.log(`Failed to parse ${field}:`, e.message);
              value = field === 'sectionImages' ? {} : [];
            }
          }
          // Ensure proper structure
          if (field === 'sectionImages' && typeof value !== 'object') {
            value = {};
          } else if (field !== 'sectionImages' && !Array.isArray(value)) {
            value = [];
          }
        }
        filteredData[field] = value;
      }
    });
    
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
    
    // Update newsletter with change tracking
    const newsletter = await Newsletter.findOneAndUpdate(
      { projectId },
      { 
        ...filteredData, 
        projectId,
        lastModifiedBy: userId,
        $push: { changeLog: changeLogEntry }
      },
      { upsert: true, new: true }
    );
    
    // Update project's lastModified
    await Project.findByIdAndUpdate(projectId, { lastModified: new Date() });
    
    res.json({ success: true, newsletter });
  } catch (error) {
    console.error('Newsletter save error:', error);
    res.status(500).json({ success: false, error: 'Failed to save newsletter' });
  }
});

// Update newsletter by ID with role-based filtering
router.put('/newsletter/:id', authMiddleware, async (req, res) => {
  try {
    const { role } = req.user;
    const allowedFields = rolePermissions[role] || [];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return res.status(403).json({ error: 'Forbidden: No allowed fields to update' });
    }
    
    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    
    res.json(newsletter);
  } catch (error) {
    console.error('Newsletter update error:', error);
    res.status(500).json({ error: 'Failed to update newsletter: ' + error.message });
  }
});

// Create new newsletter
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const newsletter = new Newsletter({
      title: req.body.title || 'New Newsletter',
      projectId: req.body.projectId,
      platform: '',
      presales: '',
      qa: '',
      enterprise: '',
      sre: '',
      ownerNotes: ''
    });
    
    await newsletter.save();
    res.json(newsletter);
  } catch (error) {
    console.error('Newsletter creation error:', error);
    res.status(500).json({ error: 'Failed to create newsletter' });
  }
});

// Generate HTML
router.post('/:projectId/generate', authMiddleware, async (req, res) => {
  try {
    const newsletter = await Newsletter.findOne({ projectId: req.params.projectId });
    if (!newsletter || !newsletter.html) {
      return res.json({ html: null, message: 'No newsletter HTML found. Please generate one first.' });
    }
    res.json({ html: newsletter.html });
  } catch (error) {
    console.error('HTML generation error:', error);
    res.status(500).json({ error: 'Failed to generate HTML' });
  }
});

module.exports = router;