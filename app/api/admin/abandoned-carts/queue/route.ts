import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  scheduleAbandonedCartDetection,
  triggerAbandonedCartDetection,
  getQueueStats,
  cleanQueue,
} from '@/lib/queue';

/**
 * GET /api/admin/abandoned-carts/queue
 * Get queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[Queue API] Error getting stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get queue stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/abandoned-carts/queue
 * Trigger queue actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'schedule':
        await scheduleAbandonedCartDetection();
        return NextResponse.json({
          success: true,
          message: 'Scheduled abandoned cart detection (every 5 minutes)',
        });

      case 'trigger':
        await triggerAbandonedCartDetection();
        return NextResponse.json({
          success: true,
          message: 'Triggered manual abandoned cart detection',
        });

      case 'clean':
        await cleanQueue();
        return NextResponse.json({
          success: true,
          message: 'Cleaned old jobs from queue',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: schedule, trigger, or clean' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[Queue API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute queue action' },
      { status: 500 }
    );
  }
}
