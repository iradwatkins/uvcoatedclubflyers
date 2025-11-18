'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSettings } from './settings/profile-settings';
import { AddressSettings } from './settings/address-settings';
import { PaymentMethodSettings } from './settings/payment-method-settings';
import { NotificationSettings } from './settings/notification-settings';
import { SecuritySettings } from './settings/security-settings';
import { LucideIcon } from 'lucide-react';

interface Tab {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface SettingsTabsProps {
  tabs: Tab[];
  user: any;
}

export function SettingsTabs({ tabs, user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings user={user} />
      </TabsContent>

      <TabsContent value="addresses">
        <AddressSettings userId={user.id} />
      </TabsContent>

      <TabsContent value="payment-methods">
        <PaymentMethodSettings userId={user.id} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationSettings userId={user.id} />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings userId={user.id} />
      </TabsContent>
    </Tabs>
  );
}
