import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let isConnected = false;

// Only create Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
  client = createClient({
    url: process.env.REDIS_URL,
  }) as RedisClientType;

  client.on('error', (err) => console.error('Redis Client Error', err));
}

async function connect() {
  if (client && !isConnected) {
    try {
      await client.connect();
      isConnected = true;
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      client = null;
    }
  }
}

export async function getRedis() {
  if (!client) {
    return null;
  }
  if (!isConnected) {
    await connect();
  }
  return client;
}

export default client;
