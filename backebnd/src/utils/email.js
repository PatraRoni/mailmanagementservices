// src/utils/email.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (to, otp, name) => {
  const mailOptions = {
    from: `"Mail App" <${process.env.SMTP_FROM}>`,
    to,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1f2937; font-size: 24px; margin: 0;">Password Reset</h1>
        </div>
        <p style="color: #374151; font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">
          You requested a password reset. Use the OTP below to reset your password.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #ffffff;">
            ${otp}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;