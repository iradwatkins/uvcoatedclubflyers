import { Carrier } from './types'
import { FedExProviderEnhanced } from './providers/fedex-enhanced'
// import { UPSProvider } from './providers/ups' // UPS not implemented yet
import { SouthwestCargoProvider } from './modules/southwest-cargo'
import {
  type ShippingAddress,
  type ShippingPackage,
  type ShippingRate,
  type ShippingLabel,
  type ShippingProvider,
  type TrackingInfo,
} from './interfaces'
import { fedexConfig, upsConfig } from './config'
import { SOUTHWEST_CARGO_CONFIG as southwestCargoConfig } from './modules/southwest-cargo/config'
// Database and caching disabled - shipping rates are calculated on-demand
// import { prisma } from '@/lib/db/prisma-adapter'
// import redis from '@/lib/redis'
const redis: { get: (key: string) => Promise<string | null>; setex: (key: string, ttl: number, value: string) => Promise<void> } | null = null

export class ShippingCalculator {
  private providers: Map<Carrier, ShippingProvider>

  constructor() {
    this.providers = new Map()

    // Initialize enabled providers
    if (fedexConfig.enabled) {
      this.providers.set(Carrier.FEDEX, new FedExProviderEnhanced())
    }
    // UPS not implemented yet - enable when UPSProvider is created
    // if (upsConfig.enabled) {
    //   this.providers.set(Carrier.UPS, new UPSProvider())
    // }
    if (southwestCargoConfig.enabled) {
      this.providers.set(Carrier.SOUTHWEST_CARGO, new SouthwestCargoProvider())
    }
  }

  /**
   * Get rates from all enabled carriers
   */
  async getAllRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[],
    useCache: boolean = true
  ): Promise<ShippingRate[]> {
    // Create cache key
    const cacheKey = this.getCacheKey(fromAddress, toAddress, packages)

    // Check cache if enabled
    if (useCache && redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return JSON.parse(cached)
        }
      } catch (error) {}
    }

    // Get rates from all providers in parallel
    const ratePromises = Array.from(this.providers.values()).map((provider) =>
      provider.getRates(fromAddress, toAddress, packages).catch((error) => {
        return []
      })
    )

    const rateArrays = await Promise.all(ratePromises)
    const allRates = rateArrays.flat()

    // Sort by price (lowest first)
    allRates.sort((a, b) => a.rateAmount - b.rateAmount)

    // Cache the results for 30 minutes
    if (redis && allRates.length > 0) {
      try {
        await redis.setex(cacheKey, 1800, JSON.stringify(allRates))
      } catch (error) {}
    }

    return allRates
  }

  /**
   * Get rates for a specific carrier
   */
  async getCarrierRates(
    carrier: Carrier,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[]
  ): Promise<ShippingRate[]> {
    const provider = this.providers.get(carrier)
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`)
    }

    return provider.getRates(fromAddress, toAddress, packages)
  }

  /**
   * Create a shipping label
   */
  async createLabel(
    carrier: Carrier,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[],
    serviceCode: string
  ): Promise<ShippingLabel> {
    const provider = this.providers.get(carrier)
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`)
    }

    return provider.createLabel(fromAddress, toAddress, packages, serviceCode)
  }

  /**
   * Track a shipment
   */
  async trackShipment(carrier: Carrier, trackingNumber: string): Promise<TrackingInfo> {
    const provider = this.providers.get(carrier)
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`)
    }

    return provider.track(trackingNumber)
  }

  /**
   * Validate an address
   */
  async validateAddress(address: ShippingAddress, carrier?: Carrier): Promise<boolean> {
    // If carrier specified, use that provider
    if (carrier) {
      const provider = this.providers.get(carrier)
      if (provider) {
        return provider.validateAddress(address)
      }
      return false
    }

    // Otherwise, validate with any available provider
    for (const provider of this.providers.values()) {
      try {
        const isValid = await provider.validateAddress(address)
        if (isValid) return true
      } catch (error) {}
    }

    return false
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(carrier: Carrier, trackingNumber: string): Promise<boolean> {
    const provider = this.providers.get(carrier)
    if (!provider || !provider.cancelShipment) {
      return false
    }

    return provider.cancelShipment(trackingNumber)
  }

  /**
   * Save rates to database for an order
   * Note: Database caching disabled - rates are calculated on-demand
   */
  async saveRatesForOrder(_orderId: string, _rates: ShippingRate[]): Promise<void> {
    // Database caching disabled - rates are calculated on-demand
    // To enable: uncomment prisma import and implement ShippingRate model in schema
    console.log('[ShippingCalculator] saveRatesForOrder is disabled')
  }

  /**
   * Get saved rates for an order
   * Note: Database caching disabled - always returns empty
   */
  async getSavedRates(_orderId: string): Promise<ShippingRate[]> {
    // Database caching disabled - rates are calculated on-demand
    return []
  }

  /**
   * Create cache key for rates
   */
  private getCacheKey(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[]
  ): string {
    const fromKey = `${fromAddress.zipCode}-${fromAddress.country || 'US'}`
    const toKey = `${toAddress.zipCode}-${toAddress.country || 'US'}`
    const packageKey = packages
      .map((p) => `${p.weight}-${p.dimensions?.width || 0}x${p.dimensions?.height || 0}`)
      .join('-')
    return `shipping:rates:${fromKey}:${toKey}:${packageKey}`
  }
}

// Export singleton instance
export const shippingCalculator = new ShippingCalculator()
