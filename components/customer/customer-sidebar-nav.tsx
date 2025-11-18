'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Settings,
  ShoppingCart,
  Package,
  Home,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerSidebarNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Browse Products',
    href: '/products',
    icon: Package,
  },
  {
    title: 'My Orders',
    href: '/dashboard/orders',
    icon: ShoppingBag,
  },
  {
    title: 'My Files',
    href: '/dashboard/files',
    icon: FileText,
  },
  {
    title: 'Shopping Cart',
    href: '/cart',
    icon: ShoppingCart,
  },
  {
    title: 'Account Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function CustomerSidebarNav({ user }: CustomerSidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">UV</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">My Account</h2>
              <p className="text-xs text-muted-foreground">UV Coated Flyers</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
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
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Back to Store
          </Link>

          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          <div className="mt-4 rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <form action="/api/auth/signout" method="post" className="mt-2">
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
