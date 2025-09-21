import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, thankYouNote, donorName, amount, senderName } = await request.json();

    // Validate required fields
    if (!email || !thankYouNote) {
      return NextResponse.json(
        { error: 'Email and thank-you note are required' },
        { status: 400 }
      );
    }

    // Create transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // Use App Password for Gmail
      },
    });

    // Alternative: Using custom SMTP
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   secure: true,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Your Support</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981, #059669); 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 28px;
              font-weight: bold;
            }
            .content { 
              padding: 40px 30px; 
            }
            .thank-you-card {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
              text-align: center;
              border-left: 4px solid #10b981;
            }
            .thank-you-title {
              font-size: 2.2rem;
              color: #1a1a1a;
              margin-bottom: 20px;
              font-family: 'Georgia', serif;
            }
            .heart {
              color: #e74c3c;
              font-size: 1.8rem;
              margin-left: 8px;
            }
            .message {
              font-size: 16px;
              line-height: 1.7;
              color: #555;
              white-space: pre-line;
            }
            .donation-info {
              background: #e8f5e8;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .footer { 
              background: #f1f3f4; 
              padding: 20px 30px; 
              text-align: center; 
              color: #666; 
              font-size: 14px;
            }
            .signature {
              margin-top: 30px;
              font-style: italic;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Personal Thank You Message</h1>
            </div>
            
            <div class="content">
              <p>Dear ${donorName || 'Amazing Supporter'},</p>
              
              <div class="donation-info">
                <strong>Your generous support of ₹${amount || '0'} means the world to us!</strong>
              </div>
              
              <div class="thank-you-card">
                <div class="thank-you-title">
                  Thank you<span class="heart">♥</span>
                </div>
                <div class="message">${thankYouNote}</div>
              </div>
              
              <div class="signature">
                With heartfelt gratitude,<br>
                ${senderName || 'The Team'}
              </div>
            </div>
            
            <div class="footer">
              <p>This message was generated with care and sent with appreciation.</p>
              <p>Thank you for being part of our community! 🙏</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Dear ${donorName || 'Amazing Supporter'},

Your generous support of ₹${amount || '0'} means the world to us!

${thankYouNote}

With heartfelt gratitude,
${senderName || 'The Team'}

---
This message was generated with care and sent with appreciation.
Thank you for being part of our community!
    `;

    // Email options
    const mailOptions = {
      from: `"${senderName || 'Support Team'}" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Thank you for your support, ${donorName || 'friend'}! 💚`,
      text: textContent,
      html: htmlContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank-you email sent successfully!' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}