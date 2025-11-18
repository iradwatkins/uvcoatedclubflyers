import { redis } from '@/lib/redis';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  options: Record<string, any>;
  price: number;
  unitPrice: number;
  uploadedFiles?: number[]; // File IDs from the files table
  addOns?: number[]; // Add-on IDs
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

function getCartKey(sessionId: string): string {
  return `cart:${sessionId}`;
}

export async function getCart(sessionId: string): Promise<Cart> {
  try {
    const cartData = await redis.get(getCartKey(sessionId));

    if (!cartData) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const cart = JSON.parse(cartData as string) as Cart;
    return cart;
  } catch (error) {
    console.error('Error getting cart:', error);
    return { items: [], total: 0, itemCount: 0 };
  }
}

export async function addToCart(sessionId: string, item: Omit<CartItem, 'id'>): Promise<Cart> {
  try {
    const cart = await getCart(sessionId);

    // Generate unique ID for cart item
    const itemId = `${item.productId}-${JSON.stringify(item.options)}-${Date.now()}`;

    const newItem: CartItem = {
      ...item,
      id: itemId,
    };

    cart.items.push(newItem);
    cart.total = cart.items.reduce((sum, i) => sum + i.price, 0);
    cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    await redis.set(getCartKey(sessionId), JSON.stringify(cart), { EX: CART_TTL });

    return cart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw new Error('Failed to add item to cart');
  }
}

export async function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<Cart> {
  try {
    const cart = await getCart(sessionId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.quantity = quantity;
    item.price = item.unitPrice * quantity;

    cart.total = cart.items.reduce((sum, i) => sum + i.price, 0);
    cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    await redis.set(getCartKey(sessionId), JSON.stringify(cart), { EX: CART_TTL });

    return cart;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw new Error('Failed to update cart item');
  }
}

export async function removeFromCart(sessionId: string, itemId: string): Promise<Cart> {
  try {
    const cart = await getCart(sessionId);

    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.total = cart.items.reduce((sum, i) => sum + i.price, 0);
    cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    if (cart.items.length === 0) {
      await redis.del(getCartKey(sessionId));
    } else {
      await redis.set(getCartKey(sessionId), JSON.stringify(cart), { EX: CART_TTL });
    }

    return cart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw new Error('Failed to remove item from cart');
  }
}

export async function clearCart(sessionId: string): Promise<void> {
  try {
    await redis.del(getCartKey(sessionId));
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw new Error('Failed to clear cart');
  }
}
