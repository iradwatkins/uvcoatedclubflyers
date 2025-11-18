import * as nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.warn('SMTP configuration is incomplete. Email features will not work.');
}

// Create transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const FROM_EMAIL = process.env.SMTP_FROM || 'support@uvcoatedflyers.com';
export const REPLY_TO_EMAIL = process.env.SMTP_REPLY_TO || 'noreply@uvcoatedflyers.com';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@uvcoatedflyers.com';

// Verify connection configuration
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
}
