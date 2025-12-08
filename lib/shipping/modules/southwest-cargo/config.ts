/**
 * Southwest Cargo Configuration
 * Pricing matches WooCommerce implementation exactly
 */

import type { SouthwestCargoRates } from './types'

/**
 * Southwest Cargo pricing structure (Official 2025 Rates)
 * Source: NFG_GeneralCommodityUS48SJU20250101.pdf & SS_GeneralCommodity_RateSheet
 * Origin: Zone 2 (Chicago) - All airport shipping starts from Chicago
 * Based on 82 airports nationwide
 */
export const SOUTHWEST_CARGO_RATES: SouthwestCargoRates = {
  pickup: {
    // Southwest Cargo Pickup (Standard Service) - Airport Pickup
    // Zone 2 (Chicago) Origin
    // Economy pricing - always cheaper than DASH
    weightTiers: [
      {
        // 0-50 lbs - Flat rate
        maxWeight: 50,
        baseRate: 80.0,
        additionalPerPound: 0,
        handlingFee: 0,
      },
      {
        // 51+ lbs - Base rate + per-pound charge (economy pricing)
        // Formula: $102 + (weight × $0.42)
        // Example: 75 lbs = $102 + (75 × $0.42) = $102 + $31.50 = $133.50
        // 100 lbs = $102 + (100 × $0.42) = $144 (below DASH $148)
        // 150 lbs = $102 + (150 × $0.42) = $165 (well below DASH $243)
        maxWeight: Infinity,
        baseRate: 102.0,
        additionalPerPound: 0.42,
        handlingFee: 0,
      },
    ],
  },
  dash: {
    // NFG (Next Flight Guaranteed) - Premium Service
    // Zone 2 (Chicago) Origin → Zone B (most destinations)
    // Source: N0000_GeneralCommodityUS48SJU20250101.pdf
    // This is the PREMIUM service - guaranteed next available flight
    weightTiers: [
      {
        // 0-25 lbs - Base Rate
        maxWeight: 25,
        baseRate: 100.0,
        additionalPerPound: 0,
        handlingFee: 0,
      },
      {
        // 26-50 lbs - Base Rate
        maxWeight: 50,
        baseRate: 117.0,
        additionalPerPound: 0,
        handlingFee: 0,
      },
      {
        // 51-100 lbs - Base Rate
        maxWeight: 100,
        baseRate: 148.0,
        additionalPerPound: 0,
        handlingFee: 0,
      },
      {
        // Over 100 lbs - Base + per-pound over 100
        // Formula: $148 + ((weight - 100) × $1.90)
        // Example: 150 lbs = $148 + (50 × $1.90) = $148 + $95 = $243
        maxWeight: Infinity,
        baseRate: 148.0,
        additionalPerPound: 1.9,
        handlingFee: 0,
      },
    ],
  },
}

/**
 * Module configuration
 */
export const SOUTHWEST_CARGO_CONFIG = {
  enabled: true,
  priority: 2, // After FedEx (priority 1)
  testMode: false,
  markupPercentage: 0, // No markup on rates
  defaultPackaging: {
    weight: 1.0, // Heavier packaging for freight
  },
}

/**
 * Service names for display
 */
export const SERVICE_NAMES = {
  SOUTHWEST_CARGO_PICKUP: 'Southwest Cargo Pickup',
  SOUTHWEST_CARGO_DASH: 'Southwest Cargo Dash',
} as const
