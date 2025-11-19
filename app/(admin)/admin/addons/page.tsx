import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import Link from 'next/link';

async function getAddOns() {
  const addOns = await prisma.$queryRaw`
    SELECT
      a.*,
      COUNT(pa.id) as product_count
    FROM add_ons a
    LEFT JOIN product_addons pa ON a.id = pa.addon_id
    GROUP BY a.id
    ORDER BY a.display_order, a.id
  `;

  return addOns;
}

export default async function AddOnsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const addOns = await getAddOns();

  const getPricingDisplay = (addOn: any) => {
    const pricing = addOn.pricing_model?.toUpperCase();
    const amount = parseFloat(addOn.pricing_amount || 0);

    switch (pricing) {
      case 'FLAT':
        return `$${amount.toFixed(2)} flat`;
      case 'PER_UNIT':
        return `$${amount.toFixed(4)}/unit`;
      case 'PERCENTAGE':
        return `${amount}% of total`;
      case 'CUSTOM':
        return addOn.pricing_details || 'Custom pricing';
      case 'FREE':
        return 'Free';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add-Ons Management</h1>
          <p className="text-muted-foreground">Manage add-on options for your products</p>
        </div>
        <Link href="/admin/addons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Add-On
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Add-Ons</CardDescription>
            <CardTitle className="text-3xl">{addOns.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {addOns.filter((a) => a.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {addOns.filter((a) => !a.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mandatory</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {addOns.filter((a) => a.is_mandatory).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Add-Ons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Add-Ons</CardTitle>
          <CardDescription>Manage pricing, availability, and product assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">ID</th>
                  <th className="pb-3 text-left font-medium">Name</th>
                  <th className="pb-3 text-left font-medium">Slug</th>
                  <th className="pb-3 text-left font-medium">Pricing</th>
                  <th className="pb-3 text-center font-medium">Products</th>
                  <th className="pb-3 text-center font-medium">Position</th>
                  <th className="pb-3 text-center font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addOns.map((addOn) => (
                  <tr key={addOn.id} className="border-b last:border-0">
                    <td className="py-4 text-sm text-muted-foreground">{addOn.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{addOn.name}</p>
                        {addOn.is_mandatory && (
                          <Badge variant="secondary" className="mt-1">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{addOn.slug}</td>
                    <td className="py-4 text-sm">{getPricingDisplay(addOn)}</td>
                    <td className="py-4 text-center">
                      <Badge variant="outline">{addOn.product_count} products</Badge>
                    </td>
                    <td className="py-4 text-center text-sm text-muted-foreground">
                      {addOn.display_position}
                    </td>
                    <td className="py-4 text-center">
                      {addOn.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/admin/addons/${addOn.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {addOns.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No add-ons found. Create your first add-on to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
