/**
 * Shared shipping types (replacement for Prisma Client types)
 */

export enum Carrier {
  FEDEX = 'FEDEX',
  UPS = 'UPS',
  USPS = 'USPS',
  SOUTHWEST_CARGO = 'SOUTHWEST_CARGO',
  DHL = 'DHL',
  FREIGHT = 'FREIGHT',
}

export type CarrierType = keyof typeof Carrier;
