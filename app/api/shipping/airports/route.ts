import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma-adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    const where: any = {
      carrier: 'SOUTHWEST_CARGO',
      isActive: true,
    }

    // Filter by state if provided
    if (state) {
      where.state = state.toUpperCase()
    }

    const airports = await prisma.airport.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        state: true,
        address: true,
        zip: true,
        hours: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      airports,
      count: airports.length,
    })
  } catch (error) {
    console.error('[Airports API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch airports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
