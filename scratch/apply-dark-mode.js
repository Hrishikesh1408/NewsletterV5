const fs = require('fs');
let html = fs.readFileSync('debug-template.html', 'utf8');

const metaTags = `
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
`;
html = html.replace('<title>', metaTags + '<title>');

const darkModeCSS = `
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .dark-bg-main { background-color: #0d1421 !important; }
      .dark-bg-content { background-color: #1a2332 !important; }
      .dark-bg-card { background-color: #232d3e !important; }
      .dark-text-primary { color: #f1f5f9 !important; }
      .dark-text-secondary { color: #94a3b8 !important; }
      .dark-border { border-color: #334155 !important; }
      .dark-bg-header { background: #1e293b !important; }
    }
    [data-ogsc] .dark-bg-main { background-color: #0d1421 !important; }
    [data-ogsc] .dark-bg-content { background-color: #1a2332 !important; }
    [data-ogsc] .dark-bg-card { background-color: #232d3e !important; }
    [data-ogsc] .dark-text-primary { color: #f1f5f9 !important; }
    [data-ogsc] .dark-text-secondary { color: #94a3b8 !important; }
`;
html = html.replace('<style type="text/css">', '<style type="text/css">' + darkModeCSS);

html = html.replace(/<td style="background-color:#ffffff; padding:0;">/g, '<td class="dark-bg-content" style="background-color:#ffffff; padding:0;">');

// Instead of breaking style string, add class correctly
html = html.replace(/<td style="background: linear-gradient\(90deg, #f0f7ff 0%, #e8f4ff 100%\);/g, '<td class="dark-bg-header" style="background: linear-gradient(90deg, #f0f7ff 0%, #e8f4ff 100%);');
html = html.replace(/<td style="background: linear-gradient\(90deg, #f0fdfa 0%, #ccfbf1 100%\);/g, '<td class="dark-bg-header" style="background: linear-gradient(90deg, #f0fdfa 0%, #ccfbf1 100%);');
html = html.replace(/<td style="background: linear-gradient\(90deg, #fdf4ff 0%, #fae8ff 100%\);/g, '<td class="dark-bg-header" style="background: linear-gradient(90deg, #fdf4ff 0%, #fae8ff 100%);');
html = html.replace(/<td style="background: linear-gradient\(90deg, #fffbeb 0%, #fef3c7 100%\);/g, '<td class="dark-bg-header" style="background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);');
html = html.replace(/<td style="background: linear-gradient\(90deg, #fef2f2 0%, #fee2e2 100%\);/g, '<td class="dark-bg-header" style="background: linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%);');

// Cards
html = html.replace(/<td style="padding:14px 16px; background:#fafcff;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#fafcff;">');
html = html.replace(/<td style="padding:14px 16px; background:#fcfaff;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#fcfaff;">');
html = html.replace(/<td style="padding:14px 16px; background:#fffdfa;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#fffdfa;">');
html = html.replace(/<td style="padding:14px 16px; background:#fffafc;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#fffafc;">');
html = html.replace(/<td style="padding:14px 16px; background:#fffafa;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#fffafa;">');
html = html.replace(/<td style="padding:14px 16px; background:#f6f9fc;">/g, '<td class="dark-bg-card" style="padding:14px 16px; background:#f6f9fc;">');
html = html.replace(/<td style="padding: 16px; background-color: #f9f9f9;/g, '<td class="dark-bg-card" style="padding: 16px; background-color: #f9f9f9;');

// Text - safe way is to add span wrapper or inject class to p/span
html = html.replace(/<p style="margin:([^;]+); font-size:([^;]+); color:#333333/g, '<p class="dark-text-primary" style="margin:$1; font-size:$2; color:#333333');
html = html.replace(/<p style="margin:([^;]+); font-size:([^;]+); color:#444444/g, '<p class="dark-text-primary" style="margin:$1; font-size:$2; color:#444444');
html = html.replace(/<p style="margin:([^;]+); font-size:([^;]+); color:#555555/g, '<p class="dark-text-secondary" style="margin:$1; font-size:$2; color:#555555');
html = html.replace(/<p style="margin:([^;]+); font-size:([^;]+); color:#666666/g, '<p class="dark-text-secondary" style="margin:$1; font-size:$2; color:#666666');
html = html.replace(/<p style="margin:([^;]+); font-size:([^;]+); color:#777777/g, '<p class="dark-text-secondary" style="margin:$1; font-size:$2; color:#777777');
html = html.replace(/<span style="font-size:([^;]+); color:#666;/g, '<span class="dark-text-secondary" style="font-size:$1; color:#666;');

// Borders
html = html.replace(/border:1px solid #e2ecf8;/g, 'border:1px solid #e2ecf8;" class="dark-border');
html = html.replace(/border:1px solid #e8e2f8;/g, 'border:1px solid #e8e2f8;" class="dark-border');
html = html.replace(/border:1px solid #f8eee2;/g, 'border:1px solid #f8eee2;" class="dark-border');
html = html.replace(/border:1px solid #f8e2ef;/g, 'border:1px solid #f8e2ef;" class="dark-border');
html = html.replace(/border:1px solid #f8e2e2;/g, 'border:1px solid #f8e2e2;" class="dark-border');
html = html.replace(/border:1px solid #eaeaea;/g, 'border:1px solid #eaeaea;" class="dark-border');
html = html.replace(/border:1px solid #eeeeee;/g, 'border:1px solid #eeeeee;" class="dark-border');
html = html.replace(/border-top:1px solid #eeeeee;/g, 'border-top:1px solid #eeeeee;" class="dark-border');

// Fix border syntax error
html = html.replace(/;" class="dark-border"/g, ';" class="dark-border"'); // oops this breaks style string too
// let's do this:
html = html.replace(/style="([^"]+)border:1px solid #e2ecf8;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #e2ecf8;$2"');
html = html.replace(/style="([^"]+)border:1px solid #e8e2f8;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #e8e2f8;$2"');
html = html.replace(/style="([^"]+)border:1px solid #f8eee2;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #f8eee2;$2"');
html = html.replace(/style="([^"]+)border:1px solid #f8e2ef;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #f8e2ef;$2"');
html = html.replace(/style="([^"]+)border:1px solid #f8e2e2;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #f8e2e2;$2"');
html = html.replace(/style="([^"]+)border:1px solid #eaeaea;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #eaeaea;$2"');
html = html.replace(/style="([^"]+)border:1px solid #eeeeee;([^"]*)"/g, 'class="dark-border" style="$1border:1px solid #eeeeee;$2"');
html = html.replace(/style="([^"]+)border-top:1px solid #eeeeee;([^"]*)"/g, 'class="dark-border" style="$1border-top:1px solid #eeeeee;$2"');


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
