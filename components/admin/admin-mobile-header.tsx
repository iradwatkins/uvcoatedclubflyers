'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AdminMobileHeaderProps {
  onMenuToggle: () => void;
}

export function AdminMobileHeader({ onMenuToggle }: AdminMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">UV</span>
          </div>
          <span className="font-semibold">Admin Panel</span>
        </Link>

        <Button variant="ghost" size="icon" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
