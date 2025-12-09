import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AutomationsPageClient } from './automations-page-client';
import { getAutomationEvents } from '@/lib/crm';

export default async function AdminAutomationsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const events = await getAutomationEvents();

  return <AutomationsPageClient initialEvents={events} />;
}
