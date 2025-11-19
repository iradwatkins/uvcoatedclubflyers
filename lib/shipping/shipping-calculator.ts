import { Carrier } from './types';
import {
  type ShippingAddress,
  type ShippingPackage,
  type ShippingRate,
  type ShippingLabel,
  type ShippingProvider,
  type TrackingInfo,
} from './interfaces';

export class ShippingCalculator {
  private providers: Map<Carrier, ShippingProvider>;

  constructor() {
    this.providers = new Map();
    // Shipping providers temporarily disabled
  }

  async getAllRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[],
    useCache: boolean = true
  ): Promise<ShippingRate[]> {
    // Return empty rates - shipping temporarily disabled
    return [];
  }

  async getCarrierRates(
    carrier: Carrier,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[]
  ): Promise<ShippingRate[]> {
    return [];
  }

  async createLabel(
    carrier: Carrier,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packages: ShippingPackage[],
    serviceCode: string
  ): Promise<ShippingLabel> {
    throw new Error('Shipping providers temporarily disabled');
  }

  async trackShipment(carrier: Carrier, trackingNumber: string): Promise<TrackingInfo> {
    throw new Error('Shipping providers temporarily disabled');
  }

  async validateAddress(address: ShippingAddress, carrier?: Carrier): Promise<boolean> {
    return true; // Accept all addresses for now
  }

  async cancelShipment(carrier: Carrier, trackingNumber: string): Promise<boolean> {
    return false;
  }

  async saveRatesForOrder(orderId: string, rates: ShippingRate[]): Promise<void> {
    // No-op
  }

  async getSavedRates(orderId: string): Promise<ShippingRate[]> {
    return [];
  }
}

export const shippingCalculator = new ShippingCalculator();
