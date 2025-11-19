/**
 * Shipping Module Registry - Stubbed Version
 * TODO: Re-implement shipping providers
 */

import { Carrier } from "./types";

export interface ShippingModuleConfig {
  enabled: boolean;
  priority: number;
  testMode?: boolean;
  config?: Record<string, any>;
}

export interface ShippingModule {
  id: string;
  name: string;
  carrier: Carrier;
  provider: any;
  config: ShippingModuleConfig;
}

class ShippingModuleRegistry {
  private modules: Map<string, ShippingModule> = new Map();

  constructor() {
    // No modules registered - shipping temporarily disabled
  }

  register(module: ShippingModule) {
    this.modules.set(module.id, module);
  }

  getModule(id: string): ShippingModule | undefined {
    return this.modules.get(id);
  }

  getAllModules(): ShippingModule[] {
    return Array.from(this.modules.values());
  }

  getEnabledModules(): ShippingModule[] {
    return [];
  }

  enableModule(id: string): boolean {
    return false;
  }

  disableModule(id: string): boolean {
    return false;
  }

  getModuleConfig(id: string): ShippingModuleConfig | undefined {
    return undefined;
  }

  updateModuleConfig(id: string, config: Partial<ShippingModuleConfig>): boolean {
    return false;
  }

  getStatus(): Record<string, { enabled: boolean; priority: number; testMode?: boolean }> {
    return {};
  }
}

let registryInstance: ShippingModuleRegistry | null = null;

export function getShippingRegistry(): ShippingModuleRegistry {
  if (!registryInstance) {
    registryInstance = new ShippingModuleRegistry();
  }
  return registryInstance;
}

export function resetShippingRegistry() {
  registryInstance = null;
}
