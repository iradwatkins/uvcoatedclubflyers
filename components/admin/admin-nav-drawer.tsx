'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Printer,
  Kanban,
  BarChart3,
  Home,
  Puzzle,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface AdminNavDrawerProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  onClose: () => void;
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Print Queue',
    href: '/admin/print-queue',
    icon: Printer,
  },
  {
    title: 'Production Board',
    href: '/admin/print-queue/kanban',
    icon: Kanban,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Add-Ons',
    href: '/admin/addons',
    icon: Puzzle,
  },
];

export function AdminNavDrawer({ user, onClose }: AdminNavDrawerProps) {
  const pathname = usePathname();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-80 max-w-[80vw] animate-slide-in-left bg-card shadow-lg md:hidden">
        <div className="flex h-full flex-col">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between border-b p-6">
            <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">UV</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">UV Coated Flyers</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="border-t p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onClose}
            >
              <Home className="h-4 w-4" />
              Back to Site
            </Link>

            <div className="mt-4 rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.name || 'Admin'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
