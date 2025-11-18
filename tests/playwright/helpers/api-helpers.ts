import { APIRequestContext } from '@playwright/test';

/**
 * API testing helpers for UV Coated Club Flyers
 */

export interface ShippingCalculationRequest {
  toAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isResidential: boolean;
  };
  items: Array<{
    quantity: number;
    weightLbs: number;
  }>;
  selectedAirportId?: string;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  serviceCode: string;
  cost: number;
  estimatedDays?: number;
  currency: string;
}

export interface Airport {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  zip: string;
  hours: Record<string, string>;
}

export class ApiHelper {
  constructor(private request: APIRequestContext, private baseURL: string) {}

  /**
   * Calculate shipping rates
   */
  async calculateShipping(data: ShippingCalculationRequest): Promise<ShippingRate[]> {
    const response = await this.request.post(`${this.baseURL}/api/shipping/calculate`, {
      data
    });

    if (!response.ok()) {
      throw new Error(`Shipping calculation failed: ${response.status()} ${await response.text()}`);
    }

    const result = await response.json();
    return result.rates || [];
  }

  /**
   * Get airports by state
   */
  async getAirportsByState(state: string): Promise<Airport[]> {
    const response = await this.request.get(`${this.baseURL}/api/shipping/airports`, {
      params: { state }
    });

    if (!response.ok()) {
      throw new Error(`Airport lookup failed: ${response.status()} ${await response.text()}`);
    }

    const result = await response.json();
    return result.airports || [];
  }

  /**
   * Get cart contents
   */
  async getCart(): Promise<any> {
    const response = await this.request.get(`${this.baseURL}/api/cart`);

    if (!response.ok()) {
      throw new Error(`Get cart failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Add item to cart
   */
  async addToCart(item: {
    productId: string;
    quantity: number;
    options: Record<string, any>;
    price: number;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/cart/add`, {
      data: item
    });

    if (!response.ok()) {
      throw new Error(`Add to cart failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<void> {
    const response = await this.request.post(`${this.baseURL}/api/cart/clear`);

    if (!response.ok()) {
      throw new Error(`Clear cart failed: ${response.status()} ${await response.text()}`);
    }
  }

  /**
   * Create order
   */
  async createOrder(orderData: any): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/orders/create`, {
      data: orderData
    });

    if (!response.ok()) {
      throw new Error(`Create order failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<any> {
    const response = await this.request.get(`${this.baseURL}/api/orders/${orderId}`);

    if (!response.ok()) {
      throw new Error(`Get order failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Process Square payment
   */
  async processSquarePayment(paymentData: {
    sourceId: string;
    amount: number;
    currency: string;
    orderNumber: string;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/checkout/process-square-payment`, {
      data: paymentData
    });

    if (!response.ok()) {
      throw new Error(`Square payment failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Create PayPal order
   */
  async createPayPalOrder(orderData: {
    amount: number;
    currency: string;
    orderNumber: string;
  }): Promise<any> {
    const response = await this.request.post(`${this.baseURL}/api/checkout/create-paypal-order`, {
      data: orderData
    });

    if (!response.ok()) {
      throw new Error(`PayPal order creation failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseURL}/api/health`);
      return response.ok();
    } catch {
      return false;
    }
  }
}

/**
 * Network monitoring helper
 */
export class NetworkMonitor {
  private requests: Array<{
    url: string;
    method: string;
    status: number;
    timing: number;
    request: any;
    response: any;
  }> = [];

  /**
   * Start monitoring network requests
   */
  startMonitoring(request: APIRequestContext) {
    // Note: This is a simplified version
    // Full implementation would use CDP or browser context listeners
  }

  /**
   * Get all captured requests
   */
  getRequests() {
    return this.requests;
  }

  /**
   * Filter requests by URL pattern
   */
  filterRequests(urlPattern: string | RegExp) {
    return this.requests.filter(req => {
      if (typeof urlPattern === 'string') {
        return req.url.includes(urlPattern);
      }
      return urlPattern.test(req.url);
    });
  }

  /**
   * Get failed requests
   */
  getFailedRequests() {
    return this.requests.filter(req => req.status >= 400);
  }

  /**
   * Get slow requests (> 2s)
   */
  getSlowRequests(threshold: number = 2000) {
    return this.requests.filter(req => req.timing > threshold);
  }

  /**
   * Export as JSON
   */
  export() {
    return JSON.stringify(this.requests, null, 2);
  }
}
