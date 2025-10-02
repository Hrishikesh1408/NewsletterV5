const express = require('express');
const TemplateConfig = require('../models/TemplateConfig');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

// Get all template configurations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const templates = await TemplateConfig.find()
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active template for editor
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const template = await TemplateConfig.findOne({ isDefault: true });
    if (!template) {
      return res.status(404).json({ success: false, error: 'No active template found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching active template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific template configuration
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const template = await TemplateConfig.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new template configuration
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, sections } = req.body;
    
    const template = new TemplateConfig({
      name,
      description,
      sections: sections || TemplateConfig.getDefaultConfig().sections,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });
    
    await template.save();
    await template.populate('createdBy', 'name email');
    await template.populate('lastModifiedBy', 'name email');
    
    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template configuration
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, sections } = req.body;
    
    const template = await TemplateConfig.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    template.name = name || template.name;
    template.description = description || template.description;
    template.sections = sections || template.sections;
    template.lastModifiedBy = req.user.id;
    
    await template.save();
    await template.populate('createdBy', 'name email');
    await template.populate('lastModifiedBy', 'name email');
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template configuration
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const template = await TemplateConfig.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    if (template.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete default template' });
    }
    
    await TemplateConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize default template if none exists
router.post('/init-default', authMiddleware, async (req, res) => {
  try {
    const existingDefault = await TemplateConfig.findOne({ isDefault: true });
    if (existingDefault) {
      return res.json({ success: true, message: 'Default template already exists', template: existingDefault });
    }
    
    const defaultConfig = TemplateConfig.getDefaultConfig();
    const template = new TemplateConfig({
      ...defaultConfig,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });
    
    await template.save();
    await template.populate('createdBy', 'name email');
    await template.populate('lastModifiedBy', 'name email');
    
    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Error initializing default template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new section to template
router.post('/:id/sections', authMiddleware, async (req, res) => {
  try {
    const { parentId, section } = req.body;
    const template = await TemplateConfig.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    const newSection = {
      id: section.id || `section-${Date.now()}`,
      title: section.title,
      enabled: section.enabled !== undefined ? section.enabled : true,
      headingOnly: section.headingOnly !== undefined ? section.headingOnly : false,
      color: section.color || '#f97316',
      order: section.order || 0,
      content: section.content || '',
      children: []
    };
    
    if (parentId) {
      // Add to parent section
      const addToParent = (sections) => {
        for (let s of sections) {
          if (s.id === parentId) {
            s.children.push(newSection);
            return true;
          }
          if (s.children && addToParent(s.children)) {
            return true;
          }
        }
        return false;
      };
      
      if (!addToParent(template.sections)) {
        return res.status(404).json({ success: false, error: 'Parent section not found' });
      }
    } else {
      // Add as root section
      template.sections.push(newSection);
    }
    
    template.lastModifiedBy = req.user.id;
    await template.save();
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reorder sections within template
router.put('/:id/sections/reorder', authMiddleware, async (req, res) => {
  try {
    const { sections } = req.body;
    const template = await TemplateConfig.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    template.sections = sections;
    template.lastModifiedBy = req.user.id;
    await template.save();
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update section order
router.put('/:id/sections/:sectionId/order', authMiddleware, async (req, res) => {
  try {
    const { order } = req.body;
    const template = await TemplateConfig.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    const updateSectionOrder = (sections) => {
      for (let section of sections) {
        if (section.id === req.params.sectionId) {
          section.order = order;
          return true;
        }
        if (section.children && updateSectionOrder(section.children)) {
          return true;
        }
      }
      return false;
    };
    
    if (!updateSectionOrder(template.sections)) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    
    template.lastModifiedBy = req.user.id;
    await template.save();
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating section order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;