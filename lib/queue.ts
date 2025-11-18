import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

// Redis connection for BullMQ
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6302', {
  maxRetriesPerRequest: null,
});

// Queue for abandoned cart detection jobs
export const abandonedCartQueue = new Queue('abandoned-carts', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 60 * 60 * 24, // 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

// Queue for email recovery jobs
export const emailRecoveryQueue = new Queue('email-recovery', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 60 * 60 * 24 * 7, // 7 days
    },
    removeOnFail: {
      count: 500,
    },
  },
});

// Queue events for monitoring
export const abandonedCartQueueEvents = new QueueEvents('abandoned-carts', {
  connection: redisConnection,
});

// Listen to queue events
abandonedCartQueueEvents.on('completed', ({ jobId }) => {
  console.log(`[Queue] Job ${jobId} completed`);
});

abandonedCartQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[Queue] Job ${jobId} failed:`, failedReason);
});

/**
 * Add a job to detect abandoned carts
 */
export async function scheduleAbandonedCartDetection() {
  try {
    const job = await abandonedCartQueue.add(
      'detect-abandoned-carts',
      {},
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'detect-abandoned-carts-recurring',
      }
    );

    console.log(`[Queue] Scheduled abandoned cart detection: ${job.id}`);
    return job;
  } catch (error) {
    console.error('[Queue] Error scheduling job:', error);
    throw error;
  }
}

/**
 * Manually trigger abandoned cart detection (for testing)
 */
export async function triggerAbandonedCartDetection() {
  try {
    const job = await abandonedCartQueue.add('detect-abandoned-carts', {});
    console.log(`[Queue] Triggered manual abandoned cart detection: ${job.id}`);
    return job;
  } catch (error) {
    console.error('[Queue] Error triggering job:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    abandonedCartQueue.getWaitingCount(),
    abandonedCartQueue.getActiveCount(),
    abandonedCartQueue.getCompletedCount(),
    abandonedCartQueue.getFailedCount(),
    abandonedCartQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Clean up old jobs
 */
export async function cleanQueue() {
  await abandonedCartQueue.clean(1000 * 60 * 60 * 24, 100, 'completed'); // 24 hours
  await abandonedCartQueue.clean(1000 * 60 * 60 * 24 * 7, 500, 'failed'); // 7 days
  await emailRecoveryQueue.clean(1000 * 60 * 60 * 24 * 7, 100, 'completed'); // 7 days
  await emailRecoveryQueue.clean(1000 * 60 * 60 * 24 * 7, 500, 'failed'); // 7 days
  console.log('[Queue] Cleaned old jobs');
}

/**
 * Schedule recovery email jobs (recurring)
 */
export async function scheduleRecoveryEmails() {
  try {
    // Email 1: Check every hour
    await emailRecoveryQueue.add(
      'send-email-1',
      {},
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
        jobId: 'send-email-1-recurring',
      }
    );

    // Email 2: Check every 4 hours
    await emailRecoveryQueue.add(
      'send-email-2',
      {},
      {
        repeat: {
          pattern: '0 */4 * * *', // Every 4 hours
        },
        jobId: 'send-email-2-recurring',
      }
    );

    // Email 3: Check every 6 hours
    await emailRecoveryQueue.add(
      'send-email-3',
      {},
      {
        repeat: {
          pattern: '0 */6 * * *', // Every 6 hours
        },
        jobId: 'send-email-3-recurring',
      }
    );

    // Mark lost carts: Daily at midnight
    await emailRecoveryQueue.add(
      'mark-lost-carts',
      {},
      {
        repeat: {
          pattern: '0 0 * * *', // Daily at midnight
        },
        jobId: 'mark-lost-carts-recurring',
      }
    );

    console.log('[Queue] Scheduled recovery email jobs');
  } catch (error) {
    console.error('[Queue] Error scheduling recovery emails:', error);
    throw error;
  }
}
