const mongoose = require('mongoose');
require('dotenv').config();

async function getNewsletterIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const newsletters = await mongoose.connection.db.collection('simplenewsletters').find({}).toArray();
    
    if (newsletters.length > 0) {
      console.log('Available newsletter IDs:');
      newsletters.forEach((newsletter, index) => {
        console.log(`${index + 1}. ${newsletter._id}`);
      });
      console.log(`\nUse this URL: http://localhost:3000/newsletter-editor.html?id=${newsletters[0]._id}`);
    } else {
      console.log('No newsletters found. Run createTestNewsletter.js first.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getNewsletterIds();