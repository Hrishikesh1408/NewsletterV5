const fs = require('fs');
let html = fs.readFileSync('dark-template.html', 'utf8');

// 1. Add keep-white CSS class if it doesn't exist
if (!html.includes('.keep-white')) {
  html = html.replace('</style>', `
    @media (prefers-color-scheme: dark) {
      .keep-white { color: #ffffff !important; }
    }
    [data-ogsc] .keep-white { color: #ffffff !important; }
  </style>`);
}

// 2. Add keep-white class to any tag that has color:#ffffff;
// We'll replace color:#ffffff; with color:#ffffff;" class="keep-white
// Wait, we need to be careful not to break style="...;" if we append class="...".
// Instead, let's replace `color:#ffffff;` with `color:#ffffff;` and if the tag has `class="`, add it there, or just add `class="keep-white"` to the tag.
// A simpler robust way: replace `color:#ffffff;"` with `color:#ffffff;" class="keep-white"`
// The problem is `style="... color:#ffffff;"` - the quote ends. Let's do:
html = html.replace(/color:#ffffff;"/g, 'color:#ffffff;" class="keep-white"');
// Wait, some might be `color:#ffffff;" class="..."`. In that case, it becomes `class="keep-white" class="..."` which is invalid HTML but browsers take the first. Let's merge them instead.
// Actually, it's safer to just inject it at the beginning of the style attribute:
html = html.replace(/style="([^"]*color:#ffffff;?[^"]*)"/g, 'class="keep-white" style="$1"');
html = html.replace(/style="([^"]*color:rgba\(255,255,255,[^"]*)"/g, 'class="keep-white" style="$1"');

// Wait! If a tag already has `class="`, then adding `class="keep-white"` will create duplicate `class` attributes.
// Let's do this: 
// 1. Remove all existing `class="keep-white"` to be safe
html = html.replace(/class="keep-white" /g, '');

// 2. We'll do string replacements for specific tags we know are white text
html = html.replace(/<p style="margin:0; font-size:13px; font-weight:700; color:#ffffff;">/g, '<p class="keep-white" style="margin:0; font-size:13px; font-weight:700; color:#ffffff;">');
html = html.replace(/<p style="margin:0; font-size:22px; font-weight:800; color:#ffffff;">/g, '<p class="keep-white" style="margin:0; font-size:22px; font-weight:800; color:#ffffff;">');
html = html.replace(/<p style="margin:0 0 10px 0; font-size:32px; font-weight:800; color:#ffffff; line-height:1.15;">/g, '<p class="keep-white" style="margin:0 0 10px 0; font-size:32px; font-weight:800; color:#ffffff; line-height:1.15;">');
html = html.replace(/<span style="color:#ffffff; font-size:11px; font-weight:700;/g, '<span class="keep-white" style="color:#ffffff; font-size:11px; font-weight:700;');
html = html.replace(/<p style="margin:0 0 6px 0; font-size:11px; font-weight:700; color:rgba\(255,255,255,0.65\);/g, '<p class="keep-white" style="margin:0 0 6px 0; font-size:11px; font-weight:700; color:rgba(255,255,255,0.65);');
html = html.replace(/<p style="margin:0; font-size:14px; color:rgba\(255,255,255,0.85\);/g, '<p class="keep-white" style="margin:0; font-size:14px; color:rgba(255,255,255,0.85);');
html = html.replace(/<p style="margin:4px 0 0 0; font-size:10px; color:rgba\(255,255,255,0.65\);/g, '<p class="keep-white" style="margin:4px 0 0 0; font-size:10px; color:rgba(255,255,255,0.65);');


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
