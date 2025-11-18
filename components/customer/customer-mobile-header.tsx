'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, ShoppingCart } from 'lucide-react';

interface CustomerMobileHeaderProps {
  onMenuToggle: () => void;
}

export function CustomerMobileHeader({ onMenuToggle }: CustomerMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">UV</span>
          </div>
          <span className="font-semibold">My Account</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
