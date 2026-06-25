const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  title: { type: String, required: true },
  platform: { type: String, default: '' },
  presales: { type: String, default: '' },
  qa: { type: String, default: '' },
  enterprise: { type: String, default: '' },
  sre: { type: String, default: '' },
  ownerNotes: { type: String, default: '' },
  intro: { type: String, default: '' },
  activities: { type: String, default: '' },
  mainContent: { type: String, default: '' },
  events: { type: String, default: '' },
  editors: mongoose.Schema.Types.Mixed,
  // Dynamic template support
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateConfig' },
  dynamicContent: mongoose.Schema.Types.Mixed, // Stores content for each section by section ID
  customSections: [{
    id: String,
    title: String,
    color: { type: String, default: '#f97316' },
    content: String
  }],
  logo: {
    src: String,
    alt: String,
    width: String,
    alignment: { type: String, default: 'center' }
  },
  businessTopics: [{
    title: String,
    content: String,
    link: String,
    images: [String] // Array of base64 image strings
  }],
  awards: [{
    name: String,
    type: String,
    role: String,
    description: String,
    photo: String // Base64 image string
  }],
  spotlight: [{
    name: String,
    role: String,
    tenure: String,
    project: String,
    tech: String,
    quote: String,
    facts: String,
    growth: String,
    reason: String,
    photo: String // Base64 image string
  }],
  joiners: [{ 
    name: String, 
    role: String, 
    image: String // Base64 image string
  }],
  birthdays: [{ 
    name: String, 
    date: String, 
    image: String, // Base64 image string
    wishes: String // Birthday wishes
  }],
  // Section-specific images
  sectionImages: {
    activities: [String], // Array of base64 image strings
    platform: [String],
    presales: [String],
    qa: [String],
    enterprise: [String],
    sre: [String],
    events: [String],
    notes: [String]
  },
  images: mongoose.Schema.Types.Mixed, // Legacy field - keeping for backward compatibility
  html: String,
  status: { type: String, default: 'draft' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeLog: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String,
    section: String,
    action: String,
    timestamp: { type: Date, default: Date.now },
    changes: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

// Create unique index for projectId
newsletterSchema.index({ projectId: 1 }, { unique: true });

module.exports = mongoose.model('Newsletter', newsletterSchema);