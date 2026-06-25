const fs = require('fs');
let html = fs.readFileSync('current-db-template.html', 'utf8');

// The missing gradients
const missingGradients = [
  'background: linear-gradient(90deg, #fff7ed 0%, #fef3e2 100%);',
  'background: linear-gradient(90deg, #fffbeb 0%, #fef9e0 100%);',
  'background: linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%);',
  'background: linear-gradient(90deg, #fdf2f8 0%, #fce7f3 100%);',
  'background: linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%);'
];

for (const gradient of missingGradients) {
  // If we match `<td style="background...` we replace it with `<td class="dark-bg-header" style="background...`
  // We need to escape parenthesis and hash symbols for regex, or just use string replace since it's global enough
  html = html.split('<td style="' + gradient).join('<td class="dark-bg-header" style="' + gradient);
}

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
