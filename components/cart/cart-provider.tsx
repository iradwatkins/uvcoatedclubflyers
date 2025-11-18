'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { SlidingCartDrawer } from './sliding-cart-drawer';
import { MiniCartTrigger } from './mini-cart-trigger';

/**
 * Global Cart Provider
 * Manages cart state and provides access to sliding cart drawer
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const {
    cart,
    upsells,
    updateQuantity,
    removeItem,
    addItem,
    trackCartOpened,
  } = useCart();

  const openCart = () => {
    setIsCartOpen(true);
    trackCartOpened();
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const handleAddUpsell = async (productId: number) => {
    // TODO: Fetch product details and add to cart
    console.log('Add upsell:', productId);
  };

  return (
    <>
      {children}

      {/* Sliding Cart Drawer */}
      <SlidingCartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        upsells={upsells}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onAddUpsell={handleAddUpsell}
      />

      {/* Mini Cart Trigger - Fixed position for quick access */}
      <div className="fixed bottom-6 right-6 z-30 md:hidden">
        <MiniCartTrigger
          itemCount={cart.itemCount}
          total={cart.total}
          onClick={openCart}
        />
      </div>
    </>
  );
}

/**
 * Cart Trigger for Header
 * Use this in navigation/header components
 */
export function CartTriggerButton() {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <MiniCartTrigger
      itemCount={cart.itemCount}
      total={cart.total}
      onClick={() => setIsCartOpen(true)}
    />
  );
}
