import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface AddOn {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  pricing_model: string;
  pricing_amount: number | null;
  pricing_details: string | null;
  base_price: string | null;
  per_unit_price: string | null;
  display_order: number;
  display_position: string | null;
  is_active: boolean;
  is_mandatory: boolean;
  product_count: bigint;
}

async function ensureCategoryColumn() {
  try {
    // Check if category column exists
    const columnCheck = await prisma.$queryRaw<{column_name: string}[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'add_ons' AND column_name = 'category'
    `;

    if (columnCheck.length === 0) {
      // Add category column
      await prisma.$executeRawUnsafe(`
        ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS category VARCHAR(100)
      `);

      // Update design-related add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Design Services'
        WHERE slug IN (
          'upload-my-artwork',
          'standard-custom-design',
          'rush-custom-design',
          'design-changes-minor',
          'design-changes-major',
          'will-upload-later'
        )
      `);

      // Update finishing add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Finishing Options'
        WHERE slug IN (
          'perforation',
          'score-only',
          'folding',
          'corner-rounding',
          'hole-drilling',
          'wafer-seal'
        )
      `);

      // Update packaging add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Packaging & Bundling'
        WHERE slug IN ('banding', 'shrink-wrapping')
      `);

      // Update premium add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Premium Finishes'
        WHERE slug IN ('foil-stamping', 'spot-uv')
      `);

      // Update personalization add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Personalization'
        WHERE slug IN ('variable-data-printing', 'numbering', 'qr-code')
      `);

      // Update pricing add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Pricing Adjustments'
        WHERE slug IN ('our-tagline', 'exact-size')
      `);

      // Update proofs add-ons
      await prisma.$executeRawUnsafe(`
        UPDATE add_ons
        SET category = 'Proofs & QC'
        WHERE slug IN ('digital-proof')
      `);

      console.log('Category column added and populated');
    }
  } catch (error) {
    console.error('Error ensuring category column:', error);
  }
}

async function getAddOns(): Promise<AddOn[]> {
  // Ensure migration is applied
  await ensureCategoryColumn();

  const addOns = await prisma.$queryRaw<AddOn[]>`
    SELECT
      a.*,
      COUNT(pa.id) as product_count
    FROM add_ons a
    LEFT JOIN product_addons pa ON a.id = pa.add_on_id
    GROUP BY a.id
    ORDER BY a.category NULLS LAST, a.display_order, a.id
  `;

  return addOns;
}

// Group add-ons by category
function groupByCategory(addOns: AddOn[]): Record<string, AddOn[]> {
  const groups: Record<string, AddOn[]> = {};

  for (const addOn of addOns) {
    const category = addOn.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
  }

  return groups;
}

// Define category order for display
const CATEGORY_ORDER = [
  'Design Services',
  'Finishing Options',
  'Packaging & Bundling',
  'Premium Finishes',
  'Personalization',
  'Proofs & QC',
  'Pricing Adjustments',
  'Other',
];

export default async function AddOnsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const addOns = await getAddOns();
  const groupedAddOns = groupByCategory(addOns);

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
        return `${addOn.pricing_amount || 0}% of total`;
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
              {addOns.filter((a) => a.is_mandatory).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Add-Ons Grouped by Category */}
      {CATEGORY_ORDER.filter(cat => groupedAddOns[cat]?.length > 0).map((category) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>
                  {category === 'Design Services' && 'Artwork upload and custom design options (shown as single dropdown to customers)'}
                  {category === 'Finishing Options' && 'Post-print finishing services'}
                  {category === 'Packaging & Bundling' && 'Bundle and protect prints'}
                  {category === 'Premium Finishes' && 'Luxury enhancements'}
                  {category === 'Personalization' && 'Variable data and unique identifiers'}
                  {category === 'Proofs & QC' && 'Quality control options'}
                  {category === 'Pricing Adjustments' && 'Discounts and markups'}
                </CardDescription>
              </div>
              <Badge variant="secondary">{groupedAddOns[category].length} options</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left font-medium text-sm">Name</th>
                    <th className="pb-3 text-left font-medium text-sm">Slug</th>
                    <th className="pb-3 text-left font-medium text-sm">Pricing</th>
                    <th className="pb-3 text-center font-medium text-sm">Status</th>
                    <th className="pb-3 text-right font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAddOns[category].map((addOn) => (
                    <tr key={addOn.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-sm">{addOn.name}</p>
                          {addOn.is_mandatory && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground font-mono">{addOn.slug}</td>
                      <td className="py-3 text-sm">{getPricingDisplay(addOn)}</td>
                      <td className="py-3 text-center">
                        {addOn.is_active ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/addons/${addOn.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {addOns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No add-ons found. Create your first add-on to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
