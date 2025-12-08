/**
 * Southwest Cargo Module Types
 */

export interface WeightTier {
  maxWeight: number
  baseRate: number
  additionalPerPound: number
  handlingFee: number
}

export interface ServiceRates {
  weightTiers: WeightTier[]
}

export interface SouthwestCargoRates {
  pickup: ServiceRates
  dash: ServiceRates
}

export interface Airport {
  id: string
  code: string
  name: string
  city: string
  state: string
  operator: string
  isActive: boolean
}
