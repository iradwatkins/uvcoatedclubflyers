import { createClient, RedisClientType } from 'redis';

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | null | undefined;
  redisInitialized: boolean;
};

// Only create Redis client if REDIS_URL is provided
let redis: RedisClientType | null = null;

if (process.env.REDIS_URL) {
  if (globalForRedis.redis !== undefined) {
    redis = globalForRedis.redis;
  } else {
    redis = createClient({
      url: process.env.REDIS_URL,
    }) as RedisClientType;

    if (!redis.isOpen) {
      redis.connect().catch((err) => {
        console.error('Redis connection error:', err);
        redis = null;
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis;
    }
  }
}

export { redis };
