import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminNav } from '@/components/admin/admin-nav';

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

  return (
    <div className="flex min-h-screen">
      {/* Side Navigation */}
      <AdminNav user={session.user} />

      {/* Main Content */}
      <div className="flex-1 pl-64">
        <div className="container py-8">{children}</div>
      </div>
    </div>
  );
}
