import { NextRequest, NextResponse } from 'next/server';
import { trackEmailOpen } from '@/lib/abandoned-cart';
import { sql } from '@/lib/db';

/**
 * GET /api/abandoned-cart/track-open
 * Track email opens via 1x1 tracking pixel
 * Returns a transparent 1x1 GIF
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cartId = searchParams.get('cid');
    const emailNum = searchParams.get('en');

    if (cartId && emailNum) {
      // Track the open asynchronously (don't block the response)
      trackEmailOpen(parseInt(cartId, 10), parseInt(emailNum, 10)).catch((err) =>
        console.error('[Track Open] Error:', err)
      );
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('[Track Open] Error:', error);

    // Still return a pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
