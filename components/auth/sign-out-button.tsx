'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SignOutButton({
  variant = 'outline',
  size = 'sm',
  className,
  showIcon = true,
  children,
}: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={cn('w-full', className)}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || 'Sign Out'}
    </Button>
  );
}
