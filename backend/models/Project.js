const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  template: { type: String, default: 'turbify' },
  month: { type: String, required: true },
  year: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);