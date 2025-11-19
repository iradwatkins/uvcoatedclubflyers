import { render } from '@react-email/components';
import { transporter, FROM_EMAIL, REPLY_TO_EMAIL, ADMIN_EMAIL } from './nodemailer';
import OrderConfirmationEmail from './templates/order-confirmation';
import AdminOrderNotification from './templates/admin-order-notification';

interface SendOrderConfirmationParams {
  to: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    configuration?: any;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderUrl: string;
}

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  try {
    const emailHtml = await render(OrderConfirmationEmail(params));

    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      replyTo: REPLY_TO_EMAIL,
      to: params.to,
      subject: `Order Confirmation - ${params.orderNumber}`,
      html: emailHtml,
    });

    console.log('Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    // Don't throw - log error but don't fail order creation
    return null;
  }
}

interface SendAdminNotificationParams {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
  orderUrl: string;
}

export async function sendAdminOrderNotification(params: SendAdminNotificationParams) {
  try {
    const emailHtml = await render(AdminOrderNotification(params));

    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `New Order: ${params.orderNumber}`,
      html: emailHtml,
    });

    console.log('Admin notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    // Don't throw - log error but don't fail order creation
    return null;
  }
}

interface SendOrderStatusUpdateParams {
  to: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  statusMessage: string;
  orderUrl: string;
}

export async function sendOrderStatusUpdate(params: SendOrderStatusUpdateParams) {
  try {
    const info = await transporter.sendMail({
      from: `"UV Coated Club Flyers" <${FROM_EMAIL}>`,
      replyTo: REPLY_TO_EMAIL,
      to: params.to,
      subject: `Order Update - ${params.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; background-color: #f9fafb; }
              .status { background-color: #dcfce7; padding: 15px; margin: 20px 0; border-left: 4px solid #16a34a; }
              .button { display: inline-block; padding: 12px 30px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Order Status Update</h1>
              </div>
              <div class="content">
                <p>Hi ${params.customerName},</p>
                <p>Your order <strong>${params.orderNumber}</strong> has been updated:</p>
                <div class="status">
                  <strong>New Status:</strong> ${params.newStatus}<br/>
                  <p>${params.statusMessage}</p>
                </div>
                <p style="text-align: center;">
                  <a href="${params.orderUrl}" class="button">View Order Details</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('Order status update email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order status update:', error);
    // Don't throw - log error but don't fail status update
    return null;
  }
}
