import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Require authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Note: Non-admin redirect is handled by middleware to avoid redirect loops

  return <AdminLayoutWrapper user={session.user}>{children}</AdminLayoutWrapper>;
}
