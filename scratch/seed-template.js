const fs = require('fs');
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const TemplateConfig = require('../models/TemplateConfig').default || require('../models/TemplateConfig');
  
  let turbify = await TemplateConfig.findOne({ name: 'Turbify' });
  const htmlContent = fs.readFileSync('template.html', 'utf8');

  if (!turbify) {
    turbify = new TemplateConfig({
      name: 'Turbify',
      description: 'Standard brand corporate email newsletter template with structured sections.',
      isDefault: true,
      html: htmlContent,
      sections: TemplateConfig.getDefaultConfig().sections
    });
    await turbify.save();
    console.log('Template inserted!');
  } else {
    turbify.html = htmlContent;
    await turbify.save();
    console.log('Template updated!');
  }
  process.exit(0);
}

seed().catch(console.error);
