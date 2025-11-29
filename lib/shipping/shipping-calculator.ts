import { Carrier } from './types';
// TODO: Re-enable shipping providers when modules are available
// import { FedExProviderEnhanced } from './providers/fedex-enhanced';
// import { UPSProvider } from './providers/ups';
// import { SouthwestCargoProvider } from './modules/southwest-cargo';
import {
  type ShippingAddress,
  type ShippingPackage,
  type ShippingRate,
  type ShippingLabel,
  type ShippingProvider,
  type TrackingInfo,
} from './interfaces';
import { fedexConfig, upsConfig } from './config';
// import { SOUTHWEST_CARGO_CONFIG as southwestCargoConfig } from './modules/southwest-cargo/config';
import { prisma } from '@/lib/db/prisma-adapter';
// import redis from '@/lib/redis' // Optional: comment out if not using Redis
const redis: { get: (key: string) => Promise<string | null>; setex: (key: string, seconds: number, value: string) => Promise<void> } | null = null; // Disable Redis for now

export class ShippingCalculator {
  private providers: Map<Carrier, ShippingProvider>;

  constructor() {
    this.providers = new Map();

    // TODO: Re-enable shipping providers when modules are available
    // Shipping temporarily disabled - no providers registered
    // if (fedexConfig.enabled) {
    //   this.providers.set(Carrier.FEDEX, new FedExProviderEnhanced());
    // }
    // if (upsConfig.enabled) {
    //   this.providers.set(Carrier.UPS, new UPSProvider());
    // }
    // if (southwestCargoConfig.enabled) {
    //   this.providers.set(Carrier.SOUTHWEST_CARGO, new SouthwestCargoProvider());
    // }
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
    const cacheKey = this.getCacheKey(fromAddress, toAddress, packages);

    // Check cache if enabled
    if (useCache && redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {}
    }

    // Get rates from all providers in parallel
    const ratePromises = Array.from(this.providers.values()).map((provider) =>
      provider.getRates(fromAddress, toAddress, packages).catch((error) => {
        return [];
      })
    );

    const rateArrays = await Promise.all(ratePromises);
    const allRates = rateArrays.flat();

    // Sort by price (lowest first)
    allRates.sort((a, b) => a.rateAmount - b.rateAmount);

    // Cache the results for 30 minutes
    if (redis && allRates.length > 0) {
      try {
        await redis.setex(cacheKey, 1800, JSON.stringify(allRates));
      } catch (error) {}
    }

    return allRates;
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
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`);
    }

    return provider.getRates(fromAddress, toAddress, packages);
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
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`);
    }

    return provider.createLabel(fromAddress, toAddress, packages, serviceCode);
  }

  /**
   * Track a shipment
   */
  async trackShipment(carrier: Carrier, trackingNumber: string): Promise<TrackingInfo> {
    const provider = this.providers.get(carrier);
    if (!provider) {
      throw new Error(`Carrier ${carrier} is not enabled`);
    }

    return provider.track(trackingNumber);
  }

  /**
   * Validate an address
   */
  async validateAddress(address: ShippingAddress, carrier?: Carrier): Promise<boolean> {
    // If carrier specified, use that provider
    if (carrier) {
      const provider = this.providers.get(carrier);
      if (provider) {
        return provider.validateAddress(address);
      }
      return false;
    }

    // Otherwise, validate with any available provider
    for (const provider of this.providers.values()) {
      try {
        const isValid = await provider.validateAddress(address);
        if (isValid) return true;
      } catch (error) {}
    }

    return false;
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(carrier: Carrier, trackingNumber: string): Promise<boolean> {
    const provider = this.providers.get(carrier);
    if (!provider || !provider.cancelShipment) {
      return false;
    }

    return provider.cancelShipment(trackingNumber);
  }

  /**
   * Save rates to database for an order
   * TODO: Re-enable when shippingRate model is added to Prisma schema
   */
  async saveRatesForOrder(orderId: string, rates: ShippingRate[]): Promise<void> {
    // Shipping rate storage temporarily disabled
    console.log(`[Shipping] Rate storage disabled - would save ${rates.length} rates for order ${orderId}`);
  }

  /**
   * Get saved rates for an order
   * TODO: Re-enable when shippingRate model is added to Prisma schema
   */
  async getSavedRates(orderId: string): Promise<ShippingRate[]> {
    // Shipping rate retrieval temporarily disabled
    console.log(`[Shipping] Rate retrieval disabled for order ${orderId}`);
    return [];
  }

  /**
   * Create cache key for rates
   */
  private getCacheKey(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[]
  ): string {
    const fromKey = `${fromAddress.zipCode}-${fromAddress.country || 'US'}`;
    const toKey = `${toAddress.zipCode}-${toAddress.country || 'US'}`;
    const packageKey = packages
      .map((p) => `${p.weight}-${p.dimensions?.width || 0}x${p.dimensions?.height || 0}`)
      .join('-');
    return `shipping:rates:${fromKey}:${toKey}:${packageKey}`;
  }
}

// Export singleton instance
export const shippingCalculator = new ShippingCalculator();
