/**
 * Southwest Cargo Airport Availability
 * Dynamically checks if Southwest Cargo serves a location based on 82 airports in database
 */

import { prisma } from '@/lib/db/prisma-adapter'

// Cache for airport states to avoid repeated DB queries
let cachedStates: Set<string> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Get all states that have Southwest Cargo airports (from 82 airports)
 */
async function getAvailableStates(): Promise<Set<string>> {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedStates && now - cacheTimestamp < CACHE_TTL) {
    return cachedStates
  }

  try {
    // Query database for all active Southwest Cargo airports
    const airports = await prisma.airport.findMany({
      where: {
        carrier: 'SOUTHWEST_CARGO',
        isActive: true,
      },
      select: {
        state: true,
      },
      distinct: ['state'],
    })

    // Extract unique states (filter out undefined/null states)
    cachedStates = new Set(airports.filter((airport) => airport.state).map((airport) => airport.state!.toUpperCase()))
    cacheTimestamp = now

    return cachedStates
  } catch (error) {
    console.error('[Southwest Cargo] Failed to load airport states from database:', error)

    // Fallback: return empty set (will disable Southwest Cargo until DB is available)
    return new Set()
  }
}

/**
 * Check if Southwest Cargo serves a specific state
 * Based on 82 airports in database
 */
export async function isStateAvailable(state: string): Promise<boolean> {
  if (!state) return false

  const availableStates = await getAvailableStates()
  const isAvailable = availableStates.has(state.toUpperCase())

  return isAvailable
}

/**
 * Get count of airports (for logging/debugging)
 */
export async function getAirportCount(): Promise<number> {
  const states = await getAvailableStates()
  return states.size
}

/**
 * Clear cache (useful for testing or when airports are updated)
 */
export function clearCache(): void {
  cachedStates = null
  cacheTimestamp = 0
}
