/**
 * Order Email Templates
 * Professional email templates for order lifecycle
 */

export interface OrderData {
  // Order Information
  orderNumber: string;
  reorderOf?: string;
  jobName?: string;
  type: string;
  status: string;
  placedAt: string;
  dueDate?: string;

  // Customer Information
  companyName?: string;
  customerName: string;
  email: string;
  primaryPhone?: string;
  alternatePhone?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };

  // Shipping Information
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  addressType?: string;
  alternateEmail?: string;
  blindShipping?: boolean;
  deliveryMethod: string;
  estimatedDeliveryDate?: string;
  trackingNumber?: string;
  carrierName?: string;

  // Order Summary
  turnaround: string;
  quantity: number;
  paperStock: string;
  coating: string;
  printJobSize: string;
  sides: string;
  designOption: string;
  designInstructions?: string;
  designFrontText?: string;
  designBackText?: string;
  addedFiles?: string;
  addedFileLinks?: string;
  notes?: string;
  selectedOptions?: string;

  // Pricing (for production email)
  pricing?: {
    productPrice: number;
    designPrice: number;
    shippingPrice: number;
    subtotal: number;
    salesTax: number;
    total: number;
  };
}

/**
 * Format address for display
 */
function formatAddress(address: { street: string; city: string; state: string; zip: string }): string {
  return `${address.street}<br>${address.city}, ${address.state} ${address.zip}`;
}

/**
 * Format price in dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Email 1: Order Confirmation
 * Sent immediately when order is placed
 */
export function generateOrderConfirmation(data: OrderData): { subject: string; html: string; text: string } {
  const subject = `Order Confirmation - #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px; background-color: #000000; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold;">UV COATED CLUB FLYERS</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello ${data.customerName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>Thank you for your order!</strong>
              </p>

              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #666666;">
                You have selected "No Call" under confirmation on your order form, we will send your order directly to print and will only call you if there are problems with your files or payment.
              </p>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666666;">
                By submitting your job to us, you agree to our terms and conditions at <a href="https://www.uvcoatedflyers.com/terms" style="color: #0066cc;">https://www.uvcoatedflyers.com/terms</a>.
              </p>

              <!-- ORDER INFORMATION -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">ORDER INFORMATION</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Order Number:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: bold;">
                    ${data.orderNumber}${data.reorderOf ? ` (Reorder of #${data.reorderOf})` : ''}
                  </td>
                </tr>
                ${data.jobName ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Job Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.jobName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Type:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Status:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.status}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Placed:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.placedAt}</td>
                </tr>
              </table>

              <!-- CUSTOMER INFORMATION -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                ${data.companyName ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Company Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.companyName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.email}</td>
                </tr>
                ${data.primaryPhone ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Primary Phone:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.primaryPhone}</td>
                </tr>
                ` : ''}
                ${data.alternatePhone ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Alternate Phone:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.alternatePhone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Billing Address:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${formatAddress(data.billingAddress)}</td>
                </tr>
              </table>

              <!-- SHIPPING INFORMATION -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">SHIPPING INFORMATION</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Shipping Address:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                    ${data.shippingAddress.name}<br>
                    ${formatAddress(data.shippingAddress)}
                  </td>
                </tr>
                ${data.addressType ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Address Type:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addressType}</td>
                </tr>
                ` : ''}
                ${data.alternateEmail ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Alternate Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.alternateEmail}</td>
                </tr>
                ` : ''}
                ${data.blindShipping ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Blind Shipping:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">Yes</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Delivery Method:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.deliveryMethod}</td>
                </tr>
                ${data.estimatedDeliveryDate ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Estimated Delivery Date:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: bold;">${data.estimatedDeliveryDate}</td>
                </tr>
                ` : ''}
              </table>

              <!-- ORDER SUMMARY -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">ORDER SUMMARY</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Turnaround:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.turnaround}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Quantity:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.quantity.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Paper Stock:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.paperStock}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Coating:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.coating}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Print Job Size:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.printJobSize}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Sides:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.sides}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Option:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designOption}</td>
                </tr>
                ${data.designInstructions ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Instructions:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designInstructions}</td>
                </tr>
                ` : ''}
                ${data.designFrontText ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Front Text:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designFrontText}</td>
                </tr>
                ` : ''}
                ${data.designBackText ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Back Text:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designBackText}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Added Files:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addedFiles || 'No files uploaded'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Added File Links:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addedFileLinks || 'No URLs provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Notes:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.notes || 'No notes entered'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Selected Options:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.selectedOptions || 'None'}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Questions about your order? Contact us at support@uvcoatedflyers.com
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hello ${data.customerName},

Thank you for your order!

You have selected "No Call" under confirmation on your order form, we will send your order directly to print and will only call you if there are problems with your files or payment.

By submitting your job to us, you agree to our terms and conditions at https://www.uvcoatedflyers.com/terms.

ORDER INFORMATION
Order Number: ${data.orderNumber}${data.reorderOf ? ` (Reorder of #${data.reorderOf})` : ''}
${data.jobName ? `Job Name: ${data.jobName}` : ''}
Type: ${data.type}
Status: ${data.status}
Placed: ${data.placedAt}

CUSTOMER INFORMATION
${data.companyName ? `Company: ${data.companyName}` : ''}
Name: ${data.customerName}
Email: ${data.email}
${data.primaryPhone ? `Phone: ${data.primaryPhone}` : ''}
Billing Address: ${data.billingAddress.street}, ${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.zip}

SHIPPING INFORMATION
Shipping To: ${data.shippingAddress.name}
${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
Delivery Method: ${data.deliveryMethod}
${data.estimatedDeliveryDate ? `Estimated Delivery: ${data.estimatedDeliveryDate}` : ''}

ORDER SUMMARY
Turnaround: ${data.turnaround}
Quantity: ${data.quantity.toLocaleString()}
Paper Stock: ${data.paperStock}
Coating: ${data.coating}
Size: ${data.printJobSize}
Sides: ${data.sides}
Design: ${data.designOption}

Questions? Contact us at support@uvcoatedflyers.com

© ${new Date().getFullYear()} UV Coated Club Flyers
  `.trim();

  return { subject, html, text };
}

/**
 * Email 2: Production Notification
 * Sent when order moves into production
 */
export function generateProductionNotification(data: OrderData): { subject: string; html: string; text: string } {
  const subject = `In Production - Order #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order In Production</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px; background-color: #000000; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold;">UV COATED CLUB FLYERS</h1>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #22c55e; color: #ffffff; padding: 15px; text-align: center; font-size: 16px; font-weight: bold;">
                ✓ YOUR ORDER IS NOW IN PRODUCTION
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello ${data.customerName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Your ${data.type} order <strong>#${data.orderNumber}</strong>${data.jobName ? ` ${data.jobName}` : ''} (${data.printJobSize}) has now been moved into production and will be completed by the due date of <strong>${data.dueDate}</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                Below is a review of the final order details and the total price charged.
              </p>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666666;">
                We appreciate you choosing UV Coated Club Flyers for all of your printing needs.
              </p>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666666;">
                Thank you!
              </p>

              <!-- ORDER INFORMATION -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">ORDER INFORMATION</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Order Number:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: bold;">
                    ${data.orderNumber}${data.reorderOf ? ` (Reorder of #${data.reorderOf})` : ''}
                  </td>
                </tr>
                ${data.jobName ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Job Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.jobName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Type:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Status:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: bold; color: #22c55e;">${data.status}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Placed:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.placedAt}</td>
                </tr>
              </table>

              <!-- CUSTOMER INFORMATION -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                ${data.companyName ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Company Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.companyName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Name:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.email}</td>
                </tr>
                ${data.primaryPhone ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Primary Phone:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.primaryPhone}</td>
                </tr>
                ` : ''}
                ${data.alternatePhone ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Alternate Phone:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.alternatePhone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Billing Address:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${formatAddress(data.billingAddress)}</td>
                </tr>
              </table>

              <!-- SHIPPING INFORMATION -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">SHIPPING INFORMATION</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Shipping Address:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">
                    ${data.shippingAddress.name}<br>
                    ${formatAddress(data.shippingAddress)}
                  </td>
                </tr>
                ${data.addressType ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Address Type:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addressType}</td>
                </tr>
                ` : ''}
                ${data.alternateEmail ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Alternate Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.alternateEmail}</td>
                </tr>
                ` : ''}
                ${data.blindShipping ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Blind Shipping:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">Yes</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Delivery Method:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.deliveryMethod}</td>
                </tr>
                ${data.estimatedDeliveryDate ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Estimated Delivery Date:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: bold;">${data.estimatedDeliveryDate}</td>
                </tr>
                ` : ''}
              </table>

              <!-- ORDER SUMMARY -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">ORDER SUMMARY</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 200px; vertical-align: top;">Turnaround:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.turnaround}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Quantity:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.quantity.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Paper Stock:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.paperStock}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Coating:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.coating}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Print Job Size:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.printJobSize}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Sides:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.sides}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Option:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designOption}</td>
                </tr>
                ${data.designInstructions ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Instructions:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designInstructions}</td>
                </tr>
                ` : ''}
                ${data.designFrontText ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Front Text:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designFrontText}</td>
                </tr>
                ` : ''}
                ${data.designBackText ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Design Back Text:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.designBackText}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Added Files:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addedFiles || 'No files uploaded'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Added File Links:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.addedFileLinks || 'No URLs provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Notes:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.notes || 'No notes entered'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666666; vertical-align: top;">Selected Options:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333333;">${data.selectedOptions || 'None'}</td>
                </tr>
              </table>

              ${data.pricing ? `
              <!-- PRICING -->
              <h2 style="margin: 30px 0 20px; font-size: 18px; color: #000000; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px;">PRICING</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #666666; border-bottom: 1px solid #e0e0e0;">Description</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; color: #666666; border-bottom: 1px solid #e0e0e0;">Quantity</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #666666; border-bottom: 1px solid #e0e0e0;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">
                      ${data.jobName || data.type} - #${data.orderNumber} ${data.printJobSize}
                    </td>
                    <td style="padding: 12px; text-align: center; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">${data.quantity.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">${formatPrice(data.pricing.productPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">Design</td>
                    <td style="padding: 12px; text-align: center; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">-</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; color: #333333; border-bottom: 1px solid #e0e0e0;">${formatPrice(data.pricing.designPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 2px solid #000000;">Shipping</td>
                    <td style="padding: 12px; text-align: center; font-size: 14px; color: #333333; border-bottom: 2px solid #000000;">-</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; color: #333333; border-bottom: 2px solid #000000;">${formatPrice(data.pricing.shippingPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #666666;" colspan="2">Order Subtotal</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; color: #333333; font-weight: bold;">${formatPrice(data.pricing.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #666666; border-bottom: 2px solid #000000;" colspan="2">Sales Tax</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; color: #333333; font-weight: bold; border-bottom: 2px solid #000000;">${formatPrice(data.pricing.salesTax)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 12px; font-size: 16px; color: #000000; font-weight: bold;" colspan="2">Order Total</td>
                    <td style="padding: 16px 12px; text-align: right; font-size: 18px; color: #000000; font-weight: bold;">${formatPrice(data.pricing.total)}</td>
                  </tr>
                </tbody>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Questions about your order? Contact us at support@uvcoatedflyers.com
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hello ${data.customerName},

YOUR ORDER IS NOW IN PRODUCTION

Your ${data.type} order #${data.orderNumber}${data.jobName ? ` ${data.jobName}` : ''} (${data.printJobSize}) has now been moved into production and will be completed by the due date of ${data.dueDate}.

Below is a review of the final order details and the total price charged.

We appreciate you choosing UV Coated Club Flyers for all of your printing needs.

Thank you!

ORDER INFORMATION
Order Number: ${data.orderNumber}${data.reorderOf ? ` (Reorder of #${data.reorderOf})` : ''}
${data.jobName ? `Job Name: ${data.jobName}` : ''}
Type: ${data.type}
Status: ${data.status}
Placed: ${data.placedAt}

[... rest of order details ...]

${data.pricing ? `
PRICING
${data.jobName || data.type} - #${data.orderNumber} ${data.printJobSize}: ${formatPrice(data.pricing.productPrice)}
Design: ${formatPrice(data.pricing.designPrice)}
Shipping: ${formatPrice(data.pricing.shippingPrice)}

Order Subtotal: ${formatPrice(data.pricing.subtotal)}
Sales Tax: ${formatPrice(data.pricing.salesTax)}

ORDER TOTAL: ${formatPrice(data.pricing.total)}
` : ''}

Questions? Contact us at support@uvcoatedflyers.com

© ${new Date().getFullYear()} UV Coated Club Flyers
  `.trim();

  return { subject, html, text };
}

/**
 * Generate Shipping Notification Email
 * Sent when order has been shipped
 */
export function generateShippingNotification(data: OrderData): { subject: string; html: string; text: string } {
  const greeting = data.customerName?.split(' ')[0] || 'Customer';
  const jobDescription = data.jobName ? `${data.jobName} ` : '';
  const carrierName = data.carrierName || 'FedEx Ground';

  const subject = `Order #${data.orderNumber} Has Shipped`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #000000;">
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: normal;">UV COATED CLUB FLYERS</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello ${greeting},
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                Your ${data.type} order <strong>#${data.orderNumber}</strong> ${jobDescription}(${data.printJobSize}) has been shipped via <strong>${carrierName}</strong>.
              </p>

              ${data.trackingNumber ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 14px; color: #666666; margin-bottom: 10px;">Your Tracking Number:</div>
                    <div style="font-size: 24px; font-weight: bold; color: #000000; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                      ${data.trackingNumber}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you,<br>
                <strong>M13 Graphics</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Questions? Contact us at support@uvcoatedflyers.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hello ${greeting},

Your ${data.type} order #${data.orderNumber} ${jobDescription}(${data.printJobSize}) has been shipped via ${carrierName}.

${data.trackingNumber ? `Your tracking number is ${data.trackingNumber}.` : ''}

Thank you,

M13 Graphics

© ${new Date().getFullYear()} UV Coated Club Flyers
Questions? Contact us at support@uvcoatedflyers.com
  `.trim();

  return { subject, html, text };
}
