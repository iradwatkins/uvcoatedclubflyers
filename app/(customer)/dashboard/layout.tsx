import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold">
              UV Coated Club Flyers
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium hover:text-primary"
              >
                Products
              </Link>
              <Link
                href="/dashboard/orders"
                className="text-sm font-medium hover:text-primary"
              >
                Orders
              </Link>
              <Link
                href="/dashboard/files"
                className="text-sm font-medium hover:text-primary"
              >
                Files
              </Link>
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium hover:text-primary"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2025 UV Coated Club Flyers. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
