import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { type ShippingAddress, type ShippingPackage } from '@/lib/shipping/interfaces'
import { getShippingRegistry } from '@/lib/shipping/module-registry'
import { splitIntoBoxes, getBoxSplitSummary } from '@/lib/shipping/box-splitter'

const calculateRequestSchema = z.object({
  toAddress: z.object({
    street: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US'),
    isResidential: z.boolean().optional(),
  }),
  items: z.array(
    z.object({
      quantity: z.number().positive(),
      weightLbs: z.number().positive(), // Weight per item in pounds
    })
  ),
  selectedAirportId: z.string().optional(), // For Southwest Cargo airport selection
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = calculateRequestSchema.safeParse(body)

    if (!validation.success) {
      console.error('[Shipping API] Validation failed:', validation.error.flatten())
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { toAddress, items, selectedAirportId } = validation.data

    // From address (UV Coated Club Flyers warehouse - Schaumburg, IL)
    const shipFrom: ShippingAddress = {
      street: '1300 Basswood Road',
      city: 'Schaumburg',
      state: 'IL',
      zipCode: '60173',
      country: 'US',
      isResidential: false,
    }

    // Calculate total weight from cart items
    let totalWeight = 0
    for (const item of items) {
      totalWeight += item.weightLbs * item.quantity
    }

    console.log(`[Shipping API] Total weight: ${totalWeight.toFixed(2)} lbs`)

    // Split into boxes using standard box dimensions and 36lb max weight
    const boxes = splitIntoBoxes(totalWeight)
    const boxSummary = getBoxSplitSummary(boxes)

    console.log(`[Shipping API] Box split: ${boxSummary}`)

    // Create shipping packages with airport metadata for Southwest Cargo
    const packages: ShippingPackage[] = boxes.map((box) => ({
      ...box,
      metadata: selectedAirportId ? { airportId: selectedAirportId } : undefined,
    }))

    // Get rates using module registry (FedEx + Southwest Cargo)
    const registry = getShippingRegistry()
    let rates: unknown[] = []

    try {
      const enabledModules = registry.getEnabledModules()
      console.log(
        '[Shipping API] Enabled modules:',
        enabledModules.map((m) => m.name)
      )

      // Fetch rates from each module with error handling
      const ratePromises = enabledModules.map((module) =>
        module.provider
          .getRates(shipFrom, toAddress, packages)
          .then((moduleRates) => {
            console.log(
              `[Shipping API] ${module.name} returned ${moduleRates.length} rates`
            )
            return moduleRates
          })
          .catch((err) => {
            console.error(`[Shipping API] ${module.name} error:`, err.message || err)
            return []
          })
      )

      // Create timeout promise (10 seconds)
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Shipping rate calculation timed out')), 10000)
      )

      const allRates = await Promise.race([Promise.all(ratePromises), timeout])
      rates = allRates.flat()

      // Filter to specific FedEx services (Ground, 2Day, Overnight, Home Delivery)
      // Plus Southwest Cargo services (Pickup, Dash)
      const ALLOWED_SERVICE_CODES = [
        'FEDEX_GROUND',
        'GROUND_HOME_DELIVERY',
        'FEDEX_2_DAY',
        'STANDARD_OVERNIGHT',
        'SOUTHWEST_CARGO_PICKUP',
        'SOUTHWEST_CARGO_DASH',
      ]

      interface ApiRate {
        serviceCode?: string
        service?: string
        cost?: number
        rateAmount?: number
        serviceName?: string
        deliveryDays?: number
        carrier?: string
      }

      rates = rates.filter((rate: unknown) => {
        const r = rate as ApiRate
        const serviceCode = r.serviceCode || r.service
        return serviceCode ? ALLOWED_SERVICE_CODES.includes(serviceCode) : false
      })

      console.log(`[Shipping API] Filtered to ${rates.length} rates`)

      // Sort rates by price (lowest to highest)
      rates.sort((a: unknown, b: unknown) => {
        const rateA = a as ApiRate
        const rateB = b as ApiRate
        const priceA = typeof rateA.cost === 'number' ? rateA.cost : rateA.rateAmount || 0
        const priceB = typeof rateB.cost === 'number' ? rateB.cost : rateB.rateAmount || 0
        return priceA - priceB
      })

      // Format rates for UI (ONLY headers, no delivery days per user requirement)
      rates = rates.map((rate: unknown) => {
        const r = rate as ApiRate
        return {
          carrier: r.carrier || 'UNKNOWN',
          service: r.serviceCode || r.service,
          serviceName: r.serviceName || r.service,
          cost: r.cost || r.rateAmount || 0,
          // deliveryDays removed per user requirement
        }
      })
    } catch (timeoutError) {
      console.error('[Shipping API] Timeout error:', timeoutError)
      rates = []
    }

    return NextResponse.json({
      success: true,
      rates,
      totalWeight: totalWeight.toFixed(2),
      boxSummary,
      numBoxes: boxes.length,
    })
  } catch (error) {
    console.error('[Shipping API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate shipping rates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
