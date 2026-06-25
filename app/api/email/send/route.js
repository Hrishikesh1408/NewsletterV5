import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: 'hrishikesheswaran@gmail.com',
    pass: 'lqts ktnm gvsv hgme'
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
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const emailList = typeof recipients === 'string'
      ? recipients.split(/[,\n]/).map(email => email.trim()).filter(email => email && email.includes('@'))
      : recipients;

    if (emailList.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid email addresses provided' }, { status: 400 });
    }

    let successCount = 0;
    let errors = [];

    for (const email of emailList) {
      try {
        const recipientName = extractNameFromEmail(email);
        let personalizedHTML = personalizeHTML(html, recipientName);

        const attachments = [];
        personalizedHTML = personalizedHTML.replace(/src="data:image\/([a-zA-Z0-9]+);base64,([^"]+)"/g, (match, ext, base64Data) => {
          const cid = crypto.randomBytes(8).toString('hex') + '@turbify.local';
          attachments.push({
            filename: `image_${attachments.length}.${ext}`,
            content: Buffer.from(base64Data, 'base64'),
            cid: cid
          });
          return `src="cid:${cid}"`;
        });

        const mailOptions = {
          from: 'hrishikesheswaran@gmail.com',
          to: email,
          subject: subject || 'Newsletter',
          html: personalizedHTML,
          attachments: attachments
        };

        await transporter.sendMail(mailOptions);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${email}:`, emailError);
        errors.push(`${email}: ${emailError.message}`);
      }
    }

    const message = `Newsletter sent successfully to ${successCount}/${emailList.length} recipients`;
    const response = { success: true, message, successCount, totalCount: emailList.length };

    if (errors.length > 0) {
      response.errors = errors;
      response.partialSuccess = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
