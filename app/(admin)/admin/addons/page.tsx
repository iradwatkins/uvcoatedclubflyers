import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, List } from 'lucide-react';
import Link from 'next/link';

interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  pricing_model: string;
  base_price: string | null;
  per_unit_price: string | null;
  ui_component: string | null;
  display_order: number;
  position: string | null;
  is_active: boolean;
  is_mandatory_default: boolean;
  product_count: bigint;
  choice_count: bigint;
}

async function getAddOns(): Promise<AddOn[]> {
  const addOns = await prisma.$queryRaw<AddOn[]>`
    SELECT
      a.*,
      COUNT(DISTINCT pa.id) as product_count,
      COUNT(DISTINCT c.id) as choice_count
    FROM add_ons a
    LEFT JOIN product_addons pa ON a.id = pa.addon_id
    LEFT JOIN add_on_choices c ON a.id = c.add_on_id
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

  const getPricingDisplay = (addOn: AddOn) => {
    const pricing = addOn.pricing_model?.toUpperCase();
    const basePrice = parseFloat(addOn.base_price || '0');
    const perUnit = parseFloat(addOn.per_unit_price || '0');

    switch (pricing) {
      case 'FLAT':
        if (basePrice === 0) return 'FREE';
        return `$${basePrice.toFixed(2)} flat`;
      case 'PER_UNIT':
        return `$${perUnit.toFixed(4)}/unit`;
      case 'PERCENTAGE':
        return `% of total`;
      case 'CUSTOM':
        if (basePrice > 0 && perUnit > 0) {
          return `$${basePrice.toFixed(2)} + $${perUnit.toFixed(4)}/unit`;
        } else if (basePrice > 0) {
          return `from $${basePrice.toFixed(2)}`;
        }
        return 'Custom pricing';
      case 'FREE':
        return 'FREE';
      default:
        return basePrice > 0 ? `$${basePrice.toFixed(2)}` : 'N/A';
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
              {addOns.filter((a) => a.is_mandatory_default).length}
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
                  <th className="pb-3 text-center font-medium">Type</th>
                  <th className="pb-3 text-center font-medium">Choices</th>
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
                        {addOn.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {addOn.description}
                          </p>
                        )}
                        {addOn.is_mandatory_default && (
                          <Badge variant="secondary" className="mt-1">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground font-mono">{addOn.slug}</td>
                    <td className="py-4 text-sm">{getPricingDisplay(addOn)}</td>
                    <td className="py-4 text-center">
                      <Badge variant="outline" className="capitalize">
                        {addOn.ui_component || 'checkbox'}
                      </Badge>
                    </td>
                    <td className="py-4 text-center">
                      {Number(addOn.choice_count) > 0 ? (
                        <Link href={`/admin/addons/${addOn.id}/choices`}>
                          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                            {Number(addOn.choice_count)} choices
                          </Badge>
                        </Link>
                      ) : addOn.ui_component === 'dropdown' ? (
                        <Link href={`/admin/addons/${addOn.id}/choices`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                            + Add choices
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 text-center text-sm text-muted-foreground">
                      {addOn.position === 'above_upload' ? 'Above Upload' : 'Below Upload'}
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
