import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      square: process.env.SQUARE_ACCESS_TOKEN ? 'configured' : 'missing',
      paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'missing',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_URL ? 'configured' : 'missing',
    }
  });
}
