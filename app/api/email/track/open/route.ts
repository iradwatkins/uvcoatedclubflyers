import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/email/track/open?cartId=xxx
 * Track email opens using a 1x1 transparent pixel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');

    if (cartId) {
      // Update open count in background (don't wait)
      sql`
        UPDATE abandoned_carts
        SET
          email_open_count = COALESCE(email_open_count, 0) + 1,
          last_opened_at = NOW(),
          updated_at = NOW()
        WHERE id = ${parseInt(cartId)}
      `.catch((error) => {
        console.error('[Email Tracking] Error tracking open:', error);
      });
    }

    // Return 1x1 transparent GIF pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('[Email Tracking] Error:', error);

    // Still return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
