const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUriMatch = envContent.match(/MONGODB_URI=(.+)/);
if (!mongoUriMatch) throw new Error('MONGODB_URI not found in .env.local');
const mongoUri = mongoUriMatch[1].trim();

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const templatePath = path.join(process.cwd(), 'turbify-newsletter-template.html');
    
    if (fs.existsSync(templatePath)) {
      const htmlContent = fs.readFileSync(templatePath, 'utf8');
      
      const parserModule = await import('./lib/templateParser.js');
      const parseHTMLTemplate = parserModule.parseHTMLTemplate;
      
      const parsed = parseHTMLTemplate(htmlContent, 'Turbify System Template', 'Default layout for Turbify');
      
      const db = mongoose.connection.db;
      const templatesCollection = db.collection('templateconfigs');
      
      const existing = await templatesCollection.findOne({ isDefault: true });
      if (existing) {
        await templatesCollection.updateOne({ _id: existing._id }, {
          $set: {
            name: parsed.name,
            description: parsed.description,
            sections: parsed.sections,
            html: parsed.html,
            updatedAt: new Date()
          }
        });
        console.log('Successfully updated existing default template!');
      } else {
        await templatesCollection.insertOne({
          name: parsed.name,
          description: parsed.description,
          isDefault: true,
          sections: parsed.sections,
          html: parsed.html,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Successfully created new default template!');
      }
    } else {
      console.log('Template file not found at', templatePath);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
