import { NextRequest, NextResponse } from 'next/server';
import { processAutomationQueue, checkScheduledAutomations } from '@/lib/crm';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow in development or if no secret is set
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron:Automations] Starting automation processing...');

    // Check scheduled automations (days_after_order, win-back, etc.)
    await checkScheduledAutomations();

    // Process queued actions
    const processed = await processAutomationQueue(100);

    console.log(`[Cron:Automations] Processed ${processed} automation actions`);

    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron:Automations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process automations', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
