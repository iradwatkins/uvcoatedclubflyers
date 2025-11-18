import nodemailer from 'nodemailer';
import {
  generateOrderConfirmation,
  generateProductionNotification,
  generateShippingNotification,
} from '@/lib/email-templates/order-emails';
import type { OrderData } from '@/lib/email-templates/order-emails';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'UV Coated Club Flyers';

/**
 * Send order confirmation email
 * Called when a new order is placed
 */
export async function sendOrderConfirmation(orderData: OrderData): Promise<boolean> {
  try {
    console.log(`[Order Email] Sending confirmation for order #${orderData.orderNumber}`);

    const { subject, html, text } = generateOrderConfirmation(orderData);

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: orderData.email,
      subject,
      text,
      html,
      headers: {
        'X-Order-Number': orderData.orderNumber,
        'X-Email-Type': 'order-confirmation',
      },
    });

    console.log(`[Order Email] Confirmation sent successfully to ${orderData.email}`);
    return true;
  } catch (error) {
    console.error(
      `[Order Email] Error sending confirmation for order #${orderData.orderNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Send production notification email
 * Called when order status changes to "production"
 */
export async function sendProductionNotification(orderData: OrderData): Promise<boolean> {
  try {
    console.log(
      `[Order Email] Sending production notification for order #${orderData.orderNumber}`
    );

    if (!orderData.pricing) {
      throw new Error('Pricing information is required for production notification');
    }

    const { subject, html, text } = generateProductionNotification(orderData);

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: orderData.email,
      subject,
      text,
      html,
      headers: {
        'X-Order-Number': orderData.orderNumber,
        'X-Email-Type': 'order-production',
      },
    });

    console.log(`[Order Email] Production notification sent successfully to ${orderData.email}`);
    return true;
  } catch (error) {
    console.error(
      `[Order Email] Error sending production notification for order #${orderData.orderNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Send shipping notification email
 * Called when order status changes to "shipped"
 */
export async function sendShippingNotification(orderData: OrderData): Promise<boolean> {
  try {
    console.log(`[Order Email] Sending shipping notification for order #${orderData.orderNumber}`);

    if (!orderData.trackingNumber) {
      console.warn(`[Order Email] No tracking number provided for order #${orderData.orderNumber}`);
    }

    const { subject, html, text } = generateShippingNotification(orderData);

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: orderData.email,
      subject,
      text,
      html,
      headers: {
        'X-Order-Number': orderData.orderNumber,
        'X-Email-Type': 'order-shipped',
      },
    });

    console.log(`[Order Email] Shipping notification sent successfully to ${orderData.email}`);
    return true;
  } catch (error) {
    console.error(
      `[Order Email] Error sending shipping notification for order #${orderData.orderNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Generic function to send order status emails
 * Can be extended for additional status types
 */
export async function sendOrderStatusEmail(status: string, orderData: OrderData): Promise<boolean> {
  switch (status.toLowerCase()) {
    case 'confirmation':
    case 'confirmed':
      return await sendOrderConfirmation(orderData);

    case 'production':
    case 'in_production':
    case 'prepress':
      return await sendProductionNotification(orderData);

    case 'shipped':
    case 'shipping':
      return await sendShippingNotification(orderData);

    // Add more status handlers as templates are created
    // case 'delivered':
    //   return await sendDeliveryNotification(orderData);

    default:
      console.warn(`[Order Email] No email template for status: ${status}`);
      return false;
  }
}

/**
 * Verify email configuration on startup
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Order Email] Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[Order Email] Email configuration verification failed:', error);
    return false;
  }
}
