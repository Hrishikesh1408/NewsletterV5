const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  section: { type: String, required: true },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  progress: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for project + section uniqueness
activitySchema.index({ projectId: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);