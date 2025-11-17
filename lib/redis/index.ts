import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6302',
});

client.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

async function connect() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

export async function getRedis() {
  if (!isConnected) {
    await connect();
  }
  return client;
}

export default client;
