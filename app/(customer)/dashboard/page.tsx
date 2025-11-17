import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Welcome, {session.user.name}!</h1>
        <p className="text-muted-foreground mt-2">
          Manage your flyer orders and designs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest printing orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Design Files</CardTitle>
            <CardDescription>Manage your uploaded designs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No files uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/products"
                className="block text-sm text-primary hover:underline"
              >
                Browse Products
              </a>
              <a
                href="/dashboard/files"
                className="block text-sm text-primary hover:underline"
              >
                Upload Design
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Email:</span> {session.user.email}
          </p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            <span className="capitalize">{session.user.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
