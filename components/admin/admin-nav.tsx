'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  Home,
  Puzzle,
  FileStack,
  Gift,
  Tag,
  ShoppingCartIcon,
  Contact,
  Zap,
} from 'lucide-react';

interface AdminNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Order Center',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Contacts',
    href: '/admin/contacts',
    icon: Contact,
  },
  {
    title: 'Automations',
    href: '/admin/automations',
    icon: Zap,
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
  {
    title: 'Paper Stocks',
    href: '/admin/paper-stocks',
    icon: FileStack,
  },
  {
    title: 'Order Bumps',
    href: '/admin/order-bumps',
    icon: Gift,
  },
  {
    title: 'Coupons',
    href: '/admin/coupons',
    icon: Tag,
  },
  {
    title: 'Abandoned Carts',
    href: '/admin/abandoned-carts',
    icon: ShoppingCartIcon,
  },
];

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card md:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">UV</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">UV Coated Flyers</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
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
        </div>
      </div>
    </aside>
  );
}
