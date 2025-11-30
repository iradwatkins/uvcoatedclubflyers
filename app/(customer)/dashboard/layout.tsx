import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CustomerDashboardWrapper } from '@/components/customer/customer-dashboard-wrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Note: Admin redirect is handled by middleware to avoid redirect loops

  return <CustomerDashboardWrapper user={session.user}>{children}</CustomerDashboardWrapper>;
}
