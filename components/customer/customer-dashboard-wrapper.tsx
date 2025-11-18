'use client';

import { useState } from 'react';
import { CustomerSidebarNav } from './customer-sidebar-nav';
import { CustomerMobileHeader } from './customer-mobile-header';
import { CustomerNavDrawer } from './customer-nav-drawer';

interface CustomerDashboardWrapperProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  children: React.ReactNode;
}

export function CustomerDashboardWrapper({ user, children }: CustomerDashboardWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <CustomerSidebarNav user={user} />

      {/* Mobile Header */}
      <CustomerMobileHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <div className="container py-8">{children}</div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <CustomerNavDrawer user={user} onClose={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}
