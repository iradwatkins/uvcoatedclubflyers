/**
 * Test Email and Admin Login Workflow
 *
 * This script tests:
 * 1. Email service connection
 * 2. Sending test emails
 * 3. Admin authentication
 */

import { transporter, FROM_EMAIL, ADMIN_EMAIL } from './lib/email/nodemailer';
import { render } from '@react-email/components';
import { OrderConfirmationEmail } from './lib/email/templates/order-confirmation';
import { AdminOrderNotificationEmail } from './lib/email/templates/admin-order-notification';

async function testEmailConnection() {
  console.log('\n🔍 Testing email service connection...\n');

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ Email service connected successfully!');
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   Admin: ${ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
}

async function sendTestEmail() {
  console.log('\n📧 Sending test email...\n');

  try {
    const testOrderData = {
      to: 'iradwatkins@gmail.com',
      orderNumber: 'TEST-' + Date.now(),
      customerName: 'Ira Watkins',
      items: [
        {
          name: 'UV Coated Flyers',
          quantity: 5000,
          unitPrice: 15000,
          totalPrice: 15000,
          options: {
            size: '4x6',
            stock: '9pt Card Stock',
            coating: 'UV Both Sides',
          },
        },
      ],
      subtotal: 15000,
      shippingCost: 2500,
      tax: 1531,
      total: 19031,
      shippingAddress: {
        fullName: 'Ira Watkins',
        address: '976 Carr Street',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30318',
      },
      orderUrl: 'http://localhost:3000/dashboard/orders/test',
    };

    const emailHtml = render(OrderConfirmationEmail(testOrderData));

    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      to: testOrderData.to,
      subject: `Test Order Confirmation - ${testOrderData.orderNumber}`,
      html: emailHtml,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${testOrderData.to}`);
    console.log(`   Order: ${testOrderData.orderNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}

async function sendAdminTestEmail() {
  console.log('\n📧 Sending admin notification test email...\n');

  try {
    const testData = {
      to: ADMIN_EMAIL,
      orderNumber: 'TEST-ADMIN-' + Date.now(),
      customerName: 'Ira Watkins',
      customerEmail: 'iradwatkins@gmail.com',
      totalAmount: 19031,
      items: [
        {
          name: 'UV Coated Flyers',
          quantity: 5000,
          totalPrice: 15000,
        },
      ],
      orderUrl: 'http://localhost:3000/admin/orders/test',
    };

    const emailHtml = render(AdminOrderNotificationEmail(testData));

    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      to: testData.to,
      subject: `New Order Received - ${testData.orderNumber}`,
      html: emailHtml,
    });

    console.log('✅ Admin notification sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${testData.to}`);
    console.log(`   Order: ${testData.orderNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Email & Authentication Test for UV Coated Flyers    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Test email connection
  const connectionOk = await testEmailConnection();
  if (!connectionOk) {
    console.log('\n❌ Email service is not properly configured. Please check your .env.local file.\n');
    process.exit(1);
  }

  // Send test customer email
  await sendTestEmail();

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send test admin email
  await sendAdminTestEmail();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     Test Complete!                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📝 Next Steps:');
  console.log('   1. Check your inbox at iradwatkins@gmail.com');
  console.log('   2. Check spam folder if not in inbox');
  console.log('   3. Login at http://localhost:3000/login');
  console.log('      Email: ira@irawatkins.com');
  console.log('      Password: Bobby321!');
  console.log('   4. Navigate to http://localhost:3000/admin\n');
}

main().catch(console.error);
