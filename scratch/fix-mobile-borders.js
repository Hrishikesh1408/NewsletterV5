const fs = require('fs');
let html = fs.readFileSync('current-db-template.html', 'utf8');

const oldCss = `.column-25 { width: 50% !important; display: inline-block !important; box-sizing: border-box !important; border-bottom: 1px solid rgba(255,255,255,0.12); border-right: none !important; }`;
const newCss = `.column-25 { width: 50% !important; display: inline-block !important; box-sizing: border-box !important; border-right: none !important; border-bottom: none !important; }
      .stat-container td:nth-child(1), .stat-container td:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.12) !important; }
      .stat-container td:nth-child(1), .stat-container td:nth-child(3) { border-right: 1px solid rgba(255,255,255,0.12) !important; }`;

html = html.replace(oldCss, newCss);

fs.writeFileSync('dark-template.html', html);
console.log('Saved to dark-template.html');

const mongoose = require('mongoose');
async function save() {
  await mongoose.connect(process.env.MONGODB_URI);
  const TemplateConfig = require('./models/TemplateConfig').default || require('./models/TemplateConfig');
  const t = await TemplateConfig.findOne({ isDefault: true });
  t.html = html;
  await t.save();
  console.log('Saved to DB!');
  process.exit(0);
}
save();
