'use client';

import { useState } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminMobileHeader } from '@/components/admin/admin-mobile-header';
import { AdminNavDrawer } from '@/components/admin/admin-nav-drawer';

interface AdminLayoutWrapperProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  children: React.ReactNode;
}

export function AdminLayoutWrapper({ user, children }: AdminLayoutWrapperProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Side Navigation */}
      <AdminNav user={user} />

      {/* Mobile Header */}
      <AdminMobileHeader onMenuToggle={() => setMobileNavOpen(true)} />

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <AdminNavDrawer user={user} onClose={() => setMobileNavOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <div className="container py-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
