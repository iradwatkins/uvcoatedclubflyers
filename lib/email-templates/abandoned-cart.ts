/**
 * Abandoned Cart Email Templates
 * 3-email sequence with increasing urgency and discounts
 */

interface Product {
  name: string;
  imageUrl?: string;
  quantity: number;
  price: number;
}

interface EmailData {
  customerName?: string;
  email: string;
  products: Product[];
  cartTotal: number;
  recoveryUrl: string;
  discountCode?: string;
  discountPercent?: number;
  expiresInHours?: number;
  cartId?: number; // For tracking
  baseUrl?: string; // Base URL for tracking pixel
}

/**
 * Format price in dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Email 1: Gentle Reminder (1 hour after abandonment)
 * No discount, just a friendly nudge
 */
export function generateEmail1(data: EmailData): { subject: string; html: string; text: string } {
  const { customerName, email, products, cartTotal, recoveryUrl } = data;
  const greeting = customerName || 'there';

  const subject = `You left items in your cart - Complete your order`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Order</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #000000;">
              <h1 style="margin: 0; font-size: 28px; color: #000000;">UV Coated Club Flyers</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #333333;">Hi ${greeting},</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666666;">
                We noticed you left some items in your cart. Don't worry, we saved them for you!
              </p>

              <!-- Products -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border: 1px solid #e0e0e0; border-radius: 4px;">
                ${products.map((product, index) => `
                  <tr style="${index > 0 ? 'border-top: 1px solid #e0e0e0;' : ''}">
                    <td style="padding: 20px;">
                      ${product.imageUrl ? `
                        <img src="${product.imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; display: block; margin-bottom: 10px;">
                      ` : ''}
                      <div style="font-size: 16px; font-weight: bold; color: #333333; margin-bottom: 5px;">${product.name}</div>
                      <div style="font-size: 14px; color: #666666;">Quantity: ${product.quantity.toLocaleString()}</div>
                      <div style="font-size: 16px; font-weight: bold; color: #000000; margin-top: 10px;">${formatPrice(product.price)}</div>
                    </td>
                  </tr>
                `).join('')}
              </table>

              <!-- Cart Total -->
              <div style="text-align: right; padding: 20px; background-color: #f9f9f9; border-radius: 4px; margin: 20px 0;">
                <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">Cart Total:</div>
                <div style="font-size: 28px; font-weight: bold; color: #000000;">${formatPrice(cartTotal)}</div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryUrl}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 18px; font-weight: bold;">
                  Complete My Order
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Need help? Reply to this email or contact us at support@uvcoatedflyers.com
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} UV Coated Club Flyers. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                You received this email because you started a checkout.
                <a href="#" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
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
Hi ${greeting},

We noticed you left some items in your cart. Don't worry, we saved them for you!

Your Cart:
${products.map(p => `- ${p.name} (${p.quantity.toLocaleString()}) - ${formatPrice(p.price)}`).join('\n')}

Cart Total: ${formatPrice(cartTotal)}

Complete your order: ${recoveryUrl}

Need help? Reply to this email or contact us at support@uvcoatedflyers.com

© ${new Date().getFullYear()} UV Coated Club Flyers
  `.trim();

  return { subject, html, text };
}

/**
 * Email 2: 5% Discount (24 hours after abandonment)
 * Add incentive with small discount
 */
export function generateEmail2(data: EmailData): { subject: string; html: string; text: string } {
  const { customerName, email, products, cartTotal, recoveryUrl, discountCode, discountPercent = 5, expiresInHours = 48 } = data;
  const greeting = customerName || 'there';
  const discountedTotal = cartTotal * (1 - discountPercent / 100);

  const subject = `${discountPercent}% OFF your cart - Limited time offer`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Discount Just For You</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #000000;">
              <h1 style="margin: 0; font-size: 28px; color: #000000;">UV Coated Club Flyers</h1>
            </td>
          </tr>

          <!-- Discount Badge -->
          <tr>
            <td style="padding: 30px 40px 0;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 16px; margin-bottom: 5px;">SPECIAL OFFER</div>
                <div style="font-size: 36px; font-weight: bold;">${discountPercent}% OFF</div>
                <div style="font-size: 14px; margin-top: 5px;">Use code: <span style="font-weight: bold; font-size: 18px;">${discountCode}</span></div>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #333333;">Hi ${greeting},</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666666;">
                We see you're still thinking about your order. Here's ${discountPercent}% off to help you decide!
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #999999;">
                ⏰ This offer expires in ${expiresInHours} hours
              </p>

              <!-- Products -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border: 1px solid #e0e0e0; border-radius: 4px;">
                ${products.slice(0, 3).map((product, index) => `
                  <tr style="${index > 0 ? 'border-top: 1px solid #e0e0e0;' : ''}">
                    <td style="padding: 20px;">
                      ${product.imageUrl ? `
                        <img src="${product.imageUrl}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 15px;">
                      ` : ''}
                      <div style="display: inline-block; vertical-align: middle;">
                        <div style="font-size: 16px; font-weight: bold; color: #333333;">${product.name}</div>
                        <div style="font-size: 14px; color: #666666;">Qty: ${product.quantity.toLocaleString()}</div>
                      </div>
                      <div style="float: right; font-size: 16px; font-weight: bold; color: #000000;">${formatPrice(product.price)}</div>
                    </td>
                  </tr>
                `).join('')}
                ${products.length > 3 ? `
                  <tr style="border-top: 1px solid #e0e0e0;">
                    <td style="padding: 15px 20px; text-align: center; color: #666666; font-size: 14px;">
                      + ${products.length - 3} more item${products.length - 3 > 1 ? 's' : ''}
                    </td>
                  </tr>
                ` : ''}
              </table>

              <!-- Price Comparison -->
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 4px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; color: #666666;">Original Total:</span>
                  <span style="font-size: 16px; color: #999999; text-decoration: line-through;">${formatPrice(cartTotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                  <span style="font-size: 16px; color: #333333; font-weight: bold;">Your Price with ${discountPercent}% OFF:</span>
                  <span style="font-size: 28px; color: #667eea; font-weight: bold;">${formatPrice(discountedTotal)}</span>
                </div>
                <div style="text-align: right; margin-top: 5px;">
                  <span style="font-size: 14px; color: #22c55e; font-weight: bold;">You save ${formatPrice(cartTotal - discountedTotal)}!</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryUrl}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                  Claim My ${discountPercent}% Discount
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Questions? We're here to help at support@uvcoatedflyers.com
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
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
Hi ${greeting},

SPECIAL OFFER: ${discountPercent}% OFF YOUR CART!

We see you're still thinking about your order. Here's ${discountPercent}% off to help you decide!

Use code: ${discountCode}
⏰ Expires in ${expiresInHours} hours

Your Cart (${products.length} item${products.length > 1 ? 's' : ''}):
${products.map(p => `- ${p.name} (${p.quantity.toLocaleString()}) - ${formatPrice(p.price)}`).join('\n')}

Original Total: ${formatPrice(cartTotal)}
Your Price with ${discountPercent}% OFF: ${formatPrice(discountedTotal)}
YOU SAVE: ${formatPrice(cartTotal - discountedTotal)}!

Claim your discount: ${recoveryUrl}

Questions? We're here to help at support@uvcoatedflyers.com

© ${new Date().getFullYear()} UV Coated Club Flyers
  `.trim();

  return { subject, html, text };
}

/**
 * Email 3: 10% Discount - Last Chance (72 hours after abandonment)
 * Final attempt with bigger discount and urgency
 */
export function generateEmail3(data: EmailData): { subject: string; html: string; text: string } {
  const { customerName, email, products, cartTotal, recoveryUrl, discountCode, discountPercent = 10, expiresInHours = 24 } = data;
  const greeting = customerName || 'there';
  const discountedTotal = cartTotal * (1 - discountPercent / 100);

  const subject = `LAST CHANCE: ${discountPercent}% OFF expires soon!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Last Chance - ${discountPercent}% OFF</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 3px solid #ef4444;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #000000;">
              <h1 style="margin: 0; font-size: 28px; color: #000000;">UV Coated Club Flyers</h1>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: #ef4444; color: #ffffff; padding: 15px; text-align: center; font-size: 14px; font-weight: bold;">
                ⚠️ LAST CHANCE - Expires in ${expiresInHours} hours!
              </div>
            </td>
          </tr>

          <!-- Discount Badge -->
          <tr>
            <td style="padding: 30px 40px 0;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);">
                <div style="font-size: 18px; margin-bottom: 5px;">FINAL OFFER</div>
                <div style="font-size: 48px; font-weight: bold;">${discountPercent}% OFF</div>
                <div style="font-size: 16px; margin-top: 10px;">Use code: <span style="font-weight: bold; font-size: 20px; background-color: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 4px;">${discountCode}</span></div>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #333333;">Hi ${greeting},</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #666666;">
                This is your <strong>last chance</strong> to complete your order with our biggest discount yet!
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #ef4444; font-weight: bold;">
                ⏰ Your ${discountPercent}% discount expires in ${expiresInHours} hours - don't miss out!
              </p>

              <!-- Products Summary -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <div style="font-size: 14px; color: #666666; margin-bottom: 10px;">Your saved cart contains:</div>
                ${products.map(p => `
                  <div style="margin: 8px 0;">
                    <span style="font-weight: bold; color: #333333;">${p.name}</span>
                    <span style="color: #666666;"> (${p.quantity.toLocaleString()})</span>
                    <span style="float: right; font-weight: bold; color: #000000;">${formatPrice(p.price)}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Price Comparison with Urgency -->
              <div style="padding: 25px; background: linear-gradient(to bottom, #fef2f2 0%, #ffffff 100%); border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; color: #666666;">Original Price:</span>
                  <span style="font-size: 18px; color: #999999; text-decoration: line-through;">${formatPrice(cartTotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 2px dashed #ef4444;">
                  <span style="font-size: 18px; color: #333333; font-weight: bold;">Final Price (${discountPercent}% OFF):</span>
                  <span style="font-size: 36px; color: #ef4444; font-weight: bold;">${formatPrice(discountedTotal)}</span>
                </div>
                <div style="text-align: center; margin-top: 15px; padding: 10px; background-color: #22c55e; color: #ffffff; border-radius: 4px;">
                  <span style="font-size: 16px; font-weight: bold;">💰 YOU SAVE ${formatPrice(cartTotal - discountedTotal)}!</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryUrl}" style="display: inline-block; padding: 20px 60px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 20px; font-weight: bold; box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5); text-transform: uppercase;">
                  Claim ${discountPercent}% OFF Now
                </a>
                <div style="margin-top: 15px; font-size: 12px; color: #999999;">
                  No coupon code needed - discount applied automatically
                </div>
              </div>

              <!-- Urgency Footer -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  ⚠️ <strong>Important:</strong> This is our final email about your cart. After ${expiresInHours} hours, your discount will expire and your cart will be cleared.
                </p>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Questions? We're here to help at support@uvcoatedflyers.com
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
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
🚨 LAST CHANCE - ${discountPercent}% OFF EXPIRES IN ${expiresInHours} HOURS! 🚨

Hi ${greeting},

This is your FINAL opportunity to complete your order with our biggest discount yet!

⏰ Your ${discountPercent}% discount expires in ${expiresInHours} hours - don't miss out!

Use code: ${discountCode}

Your Cart:
${products.map(p => `- ${p.name} (${p.quantity.toLocaleString()}) - ${formatPrice(p.price)}`).join('\n')}

Original Price: ${formatPrice(cartTotal)}
Final Price (${discountPercent}% OFF): ${formatPrice(discountedTotal)}
💰 YOU SAVE ${formatPrice(cartTotal - discountedTotal)}!

Claim your ${discountPercent}% discount now: ${recoveryUrl}

⚠️ IMPORTANT: This is our final email about your cart. After ${expiresInHours} hours, your discount will expire and your cart will be cleared.

Questions? We're here to help at support@uvcoatedflyers.com

© ${new Date().getFullYear()} UV Coated Club Flyers
  `.trim();

  return { subject, html, text };
}
