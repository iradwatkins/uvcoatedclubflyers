/**
 * Email Tracking Utilities
 * Add tracking pixels and trackable links to emails
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Generate tracking pixel HTML for email opens
 */
export function getTrackingPixel(cartId: number): string {
  return `<img src="${BASE_URL}/api/email/track/open?cartId=${cartId}" width="1" height="1" alt="" style="display:block;" />`;
}

/**
 * Add tracking to recovery URL for click tracking
 * Note: Click tracking is handled in the recovery API endpoint
 */
export function getTrackableUrl(recoveryUrl: string): string {
  // The recovery URL already tracks clicks when it's accessed
  return recoveryUrl;
}

/**
 * Insert tracking pixel before closing body tag
 */
export function addTrackingPixelToEmail(html: string, cartId?: number): string {
  if (!cartId) {
    return html;
  }

  const trackingPixel = getTrackingPixel(cartId);

  // Insert tracking pixel just before </body>
  return html.replace('</body>', `  ${trackingPixel}\n</body>`);
}
