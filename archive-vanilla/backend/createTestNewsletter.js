const mongoose = require('mongoose');
require('dotenv').config();

// Simple newsletter schema without projectId requirement
const simpleNewsletterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, default: '' },
  presales: { type: String, default: '' },
  qa: { type: String, default: '' },
  enterprise: { type: String, default: '' },
  sre: { type: String, default: '' },
  ownerNotes: { type: String, default: '' }
}, { timestamps: true });

const SimpleNewsletter = mongoose.model('SimpleNewsletter', simpleNewsletterSchema);

async function createTestNewsletter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const newsletter = await SimpleNewsletter.create({
      title: 'Test Newsletter',
      platform: 'Initial platform content',
      presales: 'Initial presales content',
      qa: 'Initial qa content',
      enterprise: 'Initial enterprise content',
      sre: 'Initial sre content',
      ownerNotes: 'Initial owner notes'
    });
    
    console.log('Created newsletter with ID:', newsletter._id);
    console.log('Use this URL to test:', `http://localhost:3000/newsletter-editor.html?id=${newsletter._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestNewsletter();