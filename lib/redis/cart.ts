import { getRedis } from './index';

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  configuration: Record<string, any>;
}

export async function getCart(userId: string): Promise<CartItem[]> {
  const redis = await getRedis();
  const cartData = await redis.get(`cart:${userId}`);

  if (!cartData) {
    return [];
  }

  return JSON.parse(cartData);
}

export async function addToCart(userId: string, item: CartItem): Promise<void> {
  const redis = await getRedis();
  const cart = await getCart(userId);

  // Check if item already exists
  const existingIndex = cart.findIndex(
    (i) => i.productId === item.productId &&
    JSON.stringify(i.configuration) === JSON.stringify(item.configuration)
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  await redis.set(`cart:${userId}`, JSON.stringify(cart), {
    EX: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function removeFromCart(
  userId: string,
  productId: number,
  configuration: Record<string, any>
): Promise<void> {
  const redis = await getRedis();
  const cart = await getCart(userId);

  const filtered = cart.filter(
    (item) =>
      !(item.productId === productId &&
        JSON.stringify(item.configuration) === JSON.stringify(configuration))
  );

  await redis.set(`cart:${userId}`, JSON.stringify(filtered), {
    EX: 60 * 60 * 24 * 7,
  });
}

export async function clearCart(userId: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(`cart:${userId}`);
}

export async function updateCartItemQuantity(
  userId: string,
  productId: number,
  configuration: Record<string, any>,
  quantity: number
): Promise<void> {
  const redis = await getRedis();
  const cart = await getCart(userId);

  const item = cart.find(
    (i) =>
      i.productId === productId &&
      JSON.stringify(i.configuration) === JSON.stringify(configuration)
  );

  if (item) {
    item.quantity = quantity;
    await redis.set(`cart:${userId}`, JSON.stringify(cart), {
      EX: 60 * 60 * 24 * 7,
    });
  }
}
