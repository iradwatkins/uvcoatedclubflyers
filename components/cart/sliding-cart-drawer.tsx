'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';

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

interface SlidingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  upsells?: Upsell[];
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onAddUpsell?: (productId: number) => Promise<void>;
}

export function SlidingCartDrawer({
  isOpen,
  onClose,
  cart,
  upsells = [],
  onUpdateQuantity,
  onRemoveItem,
  onAddUpsell,
}: SlidingCartDrawerProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await onUpdateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await onRemoveItem(itemId);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">Your Cart</h2>
                  <p className="text-sm text-muted-foreground">
                    {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Add some products to get started
                  </p>
                  <Button onClick={onClose}>Continue Shopping</Button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cart.items.map((item) => {
                    const isUpdating = updatingItems.has(item.id);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`border rounded-lg p-4 space-y-3 ${
                          isUpdating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Product Info */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{item.productName}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.options).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Quantity Controls + Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isUpdating}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(item.price)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.unitPrice)} each
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Upsells Section */}
                  {upsells.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h3 className="font-semibold mb-4">You may also like</h3>
                        <div className="space-y-3">
                          {upsells.map((upsell) =>
                            upsell.products.map((product) => (
                              <div
                                key={product.id}
                                className="border rounded-lg p-3 flex gap-3 items-center hover:bg-muted/50 transition-colors"
                              >
                                {product.image_url && (
                                  <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded">
                                    <Image
                                      src={product.image_url}
                                      alt={product.name}
                                      fill
                                      className="object-cover rounded"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {product.discountPercent && product.discountPercent > 0 ? (
                                      <>
                                        <span className="font-semibold text-sm">
                                          {formatPrice(product.finalPrice || product.base_price)}
                                        </span>
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatPrice(product.base_price)}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                          {product.discountPercent}% OFF
                                        </Badge>
                                      </>
                                    ) : (
                                      <span className="font-semibold text-sm">
                                        {formatPrice(product.base_price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onAddUpsell?.(product.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Checkout */}
            {cart.items.length > 0 && (
              <div className="border-t p-6 space-y-4 bg-muted/30">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">{formatPrice(cart.total)}</span>
                </div>
                <Link href="/checkout" onClick={onClose}>
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
