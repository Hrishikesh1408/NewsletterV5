import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import TemplateConfig from '@/models/TemplateConfig';
import fs from 'fs';
import path from 'path';
import { parseHTMLTemplate } from '@/lib/templateParser';

export async function GET() {
  try {
    await dbConnect();

    const templatePath = path.join(process.cwd(), 'turbify-newsletter-template.html');
    let templateStatus = 'Not found';
    
    try {
      if (fs.existsSync(templatePath)) {
        const htmlContent = fs.readFileSync(templatePath, 'utf8');
        const parsed = parseHTMLTemplate(htmlContent, 'Turbify System Template', 'Default layout for Turbify');
        
        let existingDefault = await TemplateConfig.findOne({ isDefault: true });
        const defaultAdmin = await User.findOne({ email: 'admin@gmail.com' });
        
        if (existingDefault) {
          existingDefault.name = parsed.name;
          existingDefault.description = parsed.description;
          existingDefault.sections = parsed.sections;
          existingDefault.html = parsed.html;
          await existingDefault.save();
          templateStatus = 'Updated existing default template';
        } else {
          const template = new TemplateConfig({
            name: parsed.name,
            description: parsed.description,
            isDefault: true,
            sections: parsed.sections,
            html: parsed.html,
            createdBy: defaultAdmin ? defaultAdmin._id : null,
            lastModifiedBy: defaultAdmin ? defaultAdmin._id : null
          });
          await template.save();
          templateStatus = 'Created new default template';
        }
      }
    } catch (err) {
      console.error('Template seed error:', err);
      templateStatus = 'Error: ' + err.message;
    }

    const users = [
      { email: 'owner@gmail.com', password: 'owner123', firstName: 'Owner', lastName: 'User', department: 'Management', role: 'owner' },
      { email: 'admin@gmail.com', password: 'admin123', firstName: 'Admin', lastName: 'User', department: 'IT', role: 'admin' },
      { email: 'platform@gmail.com', password: 'platform123', firstName: 'Platform', lastName: 'User', department: 'Engineering', role: 'platform' },
      { email: 'presales@gmail.com', password: 'presales123', firstName: 'Presales', lastName: 'User', department: 'Sales', role: 'presales' },
      { email: 'qa@gmail.com', password: 'qa123', firstName: 'QA', lastName: 'User', department: 'Quality', role: 'qa' },
      { email: 'enterprise@gmail.com', password: 'enterprise123', firstName: 'Enterprise', lastName: 'User', department: 'Solutions', role: 'enterprise' },
      { email: 'sre@gmail.com', password: 'sre123', firstName: 'SRE', lastName: 'User', department: 'Operations', role: 'sre' }
    ];

    const results = [];
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        // Trigger the pre-save hashing hook on User model
        const user = new User(userData);
        await user.save();
        results.push({ email: userData.email, role: userData.role, status: 'Created successfully' });
      } else {
        results.push({ email: userData.email, role: userData.role, status: 'Already exists' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeding completed!',
      results
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
