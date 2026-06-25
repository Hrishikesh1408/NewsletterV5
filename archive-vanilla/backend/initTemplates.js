const mongoose = require('mongoose');
const TemplateConfig = require('./models/TemplateConfig');
require('dotenv').config();

async function initializeTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if default template exists
    const existingDefault = await TemplateConfig.findOne({ isDefault: true });
    if (existingDefault) {
      console.log('Default template already exists');
      return;
    }
    
    // Create default template
    const defaultConfig = TemplateConfig.getDefaultConfig();
    const template = new TemplateConfig(defaultConfig);
    
    await template.save();
    console.log('Default template created successfully');
    
  } catch (error) {
    console.error('Error initializing templates:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initializeTemplates();