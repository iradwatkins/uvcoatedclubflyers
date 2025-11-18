import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AddonForm } from '@/components/admin/addon-form';

export default async function NewAddonPage() {
  const session = await auth();

  // Require authentication and admin role
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-10">
      <AddonForm mode="create" />
    </div>
  );
}
