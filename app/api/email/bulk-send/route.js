import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyAuth } from '@/lib/auth';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dharanigunasekar2003@gmail.com',
    pass: 'depr iqfd sels zjxl'
  }
});

function extractNameFromEmail(email) {
  const match = email.match(/([a-zA-Z]+)\.?([a-zA-Z]+)?@/);
  if (match) {
    const firstName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const lastName = match[2] ? match[2].charAt(0).toUpperCase() + match[2].slice(1) : '';
    return firstName + (lastName ? ' ' + lastName : '');
  }
  return 'Team Member';
}

function personalizeHTML(html, recipientName) {
  return html.replace(/Hello Team,/g, `Hello ${recipientName},`);
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { html, subject, recipients } = body;

    if (!html || !recipients) {
      return NextResponse.json({ success: false, error: 'HTML content and recipients are required' }, { status: 400 });
    }

    const emailList = recipients
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailList.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid emails found' }, { status: 400 });
    }

    let successCount = 0;
    let errors = [];
    const batchSize = 10;

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);

      await Promise.all(batch.map(async (email) => {
        try {
          const recipientName = extractNameFromEmail(email);
          const personalizedHTML = personalizeHTML(html, recipientName);

          await transporter.sendMail({
            from: 'dharanigunasekar2003@gmail.com',
            to: email,
            subject: subject || 'Newsletter',
            html: personalizedHTML
          });

          successCount++;
        } catch (emailError) {
          errors.push(`${email}: ${emailError.message}`);
        }
      }));

      if (i + batchSize < emailList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk send completed: ${successCount}/${emailList.length} emails sent`,
      successCount,
      totalCount: emailList.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
