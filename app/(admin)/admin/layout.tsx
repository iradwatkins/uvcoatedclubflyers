import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminLayoutWrapper } from '@/components/admin/admin-layout-wrapper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Require authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Require admin role
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminLayoutWrapper user={session.user}>{children}</AdminLayoutWrapper>;
}
