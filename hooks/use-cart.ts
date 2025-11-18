'use client';

import useSWR from 'swr';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  options: Record<string, string>;
  price: number;
  unitPrice: number;
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface Upsell {
  id: number;
  name: string;
  products: Array<{
    id: number;
    name: string;
    base_price: number;
    image_url: string | null;
    discountPercent?: number;
    finalPrice?: number;
  }>;
}

interface CartSession {
  id: number;
  itemCount: number;
  totalValue: number;
  lastActivity: string;
}

interface CartData {
  cart: Cart;
  upsells: Upsell[];
  session: CartSession | null;
}

const fetcher = async (url: string): Promise<CartData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch cart');
  }
  return res.json();
};

export function useCart() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<CartData>('/api/cart/session', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const cart = data?.cart || { items: [], total: 0, itemCount: 0 };
  const upsells = data?.upsells || [];
  const session = data?.session || null;

  /**
   * Add item to cart
   */
  const addItem = async (item: {
    productId: string;
    productName: string;
    quantity: number;
    options: Record<string, string>;
    price: number;
    unitPrice: number;
  }) => {
    try {
      const response = await fetch('/api/cart/add-ajax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();

      // Optimistically update the cart
      mutate();

      return result;
    } catch (error) {
      console.error('[useCart] Add item error:', error);
      throw error;
    }
  };

  /**
   * Update item quantity
   */
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      // Optimistic update
      const optimisticCart = {
        ...data,
        cart: {
          ...cart,
          items: cart.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, price: item.unitPrice * quantity }
              : item
          ),
        },
      };

      mutate(
        async () => {
          const response = await fetch(`/api/cart/update/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            throw new Error('Failed to update quantity');
          }

          return response.json();
        },
        {
          optimisticData: optimisticCart as CartData,
          rollbackOnError: true,
          populateCache: (result) => ({
            cart: result.cart,
            upsells: data?.upsells || [],
            session: data?.session || null,
          }),
        }
      );
    } catch (error) {
      console.error('[useCart] Update quantity error:', error);
      throw error;
    }
  };

  /**
   * Remove item from cart
   */
  const removeItem = async (itemId: string) => {
    try {
      // Optimistic update
      const optimisticCart = {
        ...data,
        cart: {
          ...cart,
          items: cart.items.filter((item) => item.id !== itemId),
        },
      };

      mutate(
        async () => {
          const response = await fetch(`/api/cart/remove/${itemId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to remove item');
          }

          return response.json();
        },
        {
          optimisticData: optimisticCart as CartData,
          rollbackOnError: true,
          populateCache: (result) => ({
            cart: result.cart,
            upsells: data?.upsells || [],
            session: data?.session || null,
          }),
        }
      );
    } catch (error) {
      console.error('[useCart] Remove item error:', error);
      throw error;
    }
  };

  /**
   * Track cart opened event
   */
  const trackCartOpened = async () => {
    try {
      await fetch('/api/cart/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'cart_opened' }),
      });
    } catch (error) {
      console.error('[useCart] Track error:', error);
    }
  };

  return {
    cart,
    upsells,
    session,
    isLoading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    trackCartOpened,
    refresh: mutate,
  };
}
