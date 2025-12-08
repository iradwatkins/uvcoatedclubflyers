'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniCartTriggerProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

export function MiniCartTrigger({ itemCount, total, onClick }: MiniCartTriggerProps) {
  const formatPrice = (dollars: number) => {
    return `$${dollars.toFixed(2)}`;
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} className="relative gap-2">
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -top-2 -right-2"
            >
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="hidden md:flex flex-col items-start">
        <span className="text-xs text-muted-foreground">Cart</span>
        <span className="text-sm font-semibold leading-none">{formatPrice(total)}</span>
      </div>
    </Button>
  );
}
