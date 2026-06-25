const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const TemplateConfig = require('../models/TemplateConfig').default || require('../models/TemplateConfig');
  const t = await TemplateConfig.findOne({});
  if (!t) {
    console.log('No template found');
    process.exit(1);
  }

  const joinersHeader = `            <!-- ─── JOINERS SECTION HEADER ─── -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background: linear-gradient(90deg, #f0fdfa 0%, #ccfbf1 100%); padding:16px 36px; border-top:3px solid #0d9488;">
                  <p style="margin:0; font-size:13px; font-weight:800; color:#0f766e; text-transform:uppercase; letter-spacing:1.5px;">👋 &nbsp;Welcome New Joiners!</p>
                </td>
              </tr>
            </table>

            {{joiners}}

            <!-- ─── BIRTHDAYS SECTION HEADER ─── -->`;

  if (!t.html.includes('<!-- ─── JOINERS SECTION HEADER ─── -->')) {
    t.html = t.html.replace('<!-- ─── BIRTHDAYS SECTION HEADER ─── -->', joinersHeader);
    await t.save();
    console.log('Template updated with joiners!');
  } else {
    console.log('Template already has joiners.');
  }
  process.exit(0);
}

main().catch(console.error);
