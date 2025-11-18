import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsTabs } from '@/components/customer/settings-tabs';
import { User, MapPin, Bell, Lock, CreditCard } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const tabs = [
    {
      value: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      value: 'addresses',
      label: 'Addresses',
      icon: MapPin,
    },
    {
      value: 'payment-methods',
      label: 'Payment Methods',
      icon: CreditCard,
    },
    {
      value: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      value: 'security',
      label: 'Security',
      icon: Lock,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsTabs tabs={tabs} user={session.user} />
    </div>
  );
}
