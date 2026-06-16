import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"ATS by srebuilds.tech" <${process.env.EMAIL_USER || 'saransridatta.2006@gmail.com'}>`,
    to,
    subject: 'Your Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">ATS by srebuilds.tech</h2>
        </div>
        <div style="padding: 30px; background-color: white;">
          <p style="font-size: 16px; color: #334155;">Hello,</p>
          <p style="font-size: 16px; color: #334155;">Use the following verification code to securely sign in to your account. This code will expire in 10 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; background-color: #f1f5f9; border-radius: 8px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} SRE Builds. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
