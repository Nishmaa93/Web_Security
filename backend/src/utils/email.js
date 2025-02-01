import nodemailer from 'nodemailer';

const generateEmailTemplate = (type, data) => {
  switch (type) {
    case 'verification':
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Code & Compass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #9333ea, #ec4899); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0; }
    .content { background: white; padding: 40px 20px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body style="background-color: #f3f4f6;">
  <div class="container">
    <div class="header">
      <div class="logo">Code & Compass</div>
      <div style="color: white; opacity: 0.9;">Your Journey in Tech Starts Here</div>
    </div>
    <div class="content">
      <h1>Welcome to Code & Compass! 👋</h1>
      <p>Thank you for joining our community. To get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p style="font-size: 14px; color: #6b7280;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      <div class="footer">
        <p>Code & Compass - Where Developers Connect</p>
        <p style="font-size: 12px;">© 2024 Code & Compass. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    case 'resetPassword':
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Code & Compass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #9333ea, #ec4899); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0; }
    .content { background: white; padding: 40px 20px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body style="background-color: #f3f4f6;">
  <div class="container">
    <div class="header">
      <div class="logo">Code & Compass</div>
      <div style="color: white; opacity: 0.9;">Password Reset Request</div>
    </div>
    <div class="content">
      <h1>Reset Your Password 🔐</h1>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #6b7280;">This link will expire in 30 minutes. If you didn't request this change, please ignore this email or contact support if you have concerns.</p>
      <div class="footer">
        <p>Code & Compass - Where Developers Connect</p>
        <p style="font-size: 12px;">© 2024 Code & Compass. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    default:
      return '';
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const html = generateEmailTemplate('resetPassword', { resetUrl });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset Your Password - StyleHub',
    html
  };
  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  const html = generateEmailTemplate('verification', { verificationUrl });

  // Set email options
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify Your Email - Code & Compass',
    html
  };

  return transporter.sendMail(mailOptions);
};