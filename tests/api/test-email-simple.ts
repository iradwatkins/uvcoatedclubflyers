/**
 * Simple Email Test with dotenv
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as nodemailer from 'nodemailer';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║           Email Service Test - UV Coated Flyers       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📧 Email Configuration:');
console.log(`   Host: ${process.env.SMTP_HOST}`);
console.log(`   Port: ${process.env.SMTP_PORT}`);
console.log(`   User: ${process.env.SMTP_USER}`);
console.log(`   From: ${process.env.SMTP_FROM}`);
console.log(`   Admin: ${process.env.ADMIN_EMAIL}\n`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testConnection() {
  try {
    console.log('🔍 Testing SMTP connection...\n');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

async function sendTestEmail() {
  try {
    console.log('📨 Sending test email...\n');

    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${process.env.SMTP_FROM}>`,
      to: 'iradwatkins@gmail.com',
      subject: 'Test Email from UV Coated Flyers - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">UV Coated Club Flyers</h1>
          <h2>Email Test Successful!</h2>
          <p>This is a test email from your UV Coated Club Flyers website.</p>
          <p><strong>Email service is working correctly!</strong></p>
          <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: ${process.env.SMTP_FROM}<br>
            Using: ${process.env.SMTP_HOST}
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: iradwatkins@gmail.com\n`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without SMTP connection.\n');
    process.exit(1);
  }

  await sendTestEmail();

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                   Test Complete!                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📝 Check your inbox at: iradwatkins@gmail.com');
  console.log('   (Check spam folder if not in inbox)\n');

  console.log('🔐 Admin Login Credentials:');
  console.log('   URL: http://localhost:3000/login');
  console.log('   Email: ira@irawatkins.com');
  console.log('   Password: Bobby321!\n');
}

main().catch(console.error);
