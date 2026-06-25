const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const TemplateConfig = require('../models/TemplateConfig').default || require('../models/TemplateConfig');
  const t = await TemplateConfig.findOne({});
  if (!t) {
    console.log('No template found');
    process.exit(1);
  }

  t.html = t.html.replace(/May 2026/g, '{{monthYear}}');

  const oldSpan = '<span style="color:#60a5fa; font-size:11px; font-weight:600;">turbify.com</span>';
  const newLink = '<a href="https://turbify.com" target="_blank" style="color:#60a5fa; font-size:11px; font-weight:600; text-decoration:none;">turbify.com</a>';
  t.html = t.html.replace(oldSpan, newLink);

  await t.save();
  console.log('Template footer updated!');
  process.exit(0);
}

main().catch(console.error);
