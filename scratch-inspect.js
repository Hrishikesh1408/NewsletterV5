require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const templatesCollection = db.collection('templateconfigs');
    const existing = await templatesCollection.findOne({ isDefault: true });
    if (existing) {
      console.log('Sections length:', existing.sections ? existing.sections.length : 'none');
      console.log(JSON.stringify(existing.sections, null, 2));
    } else {
      console.log('No default template found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
