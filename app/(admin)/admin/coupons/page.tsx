import { sql } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag, Percent, DollarSign, Truck } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: Date | null;
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
}

async function getCoupons() {
  const coupons = await sql<Coupon[]>`
    SELECT
      id, code, name, description, discount_type, discount_value,
      min_order_amount, usage_limit, usage_count, starts_at, expires_at,
      is_active, created_at
    FROM coupons
    ORDER BY created_at DESC
  `;
  return coupons;
}

function getDiscountIcon(type: string) {
  switch (type) {
    case 'percentage':
      return <Percent className="h-4 w-4" />;
    case 'free_shipping':
      return <Truck className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
}

function formatDiscount(coupon: Coupon) {
  switch (coupon.discount_type) {
    case 'percentage':
      return `${coupon.discount_value}% off`;
    case 'free_shipping':
      return 'Free Shipping';
    case 'fixed_cart':
      return `$${coupon.discount_value.toFixed(2)} off`;
    case 'fixed_product':
      return `$${coupon.discount_value.toFixed(2)} per item`;
    default:
      return coupon.discount_value.toString();
  }
}

export default async function AdminCouponsPage() {
  const coupons = await getCoupons();

  const activeCoupons = coupons.filter((c) => c.is_active);
  const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCoupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.length > 0 ? Math.round((totalUsage / coupons.length) * 100) / 100 : 0} avg
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            Manage your promotional codes and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No coupons created yet. Create your first coupon to start offering discounts.
              </div>
            ) : (
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Discount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Min. Order</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Usage</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => {
                      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                      const isLimitReached = coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit;

                      return (
                        <tr key={coupon.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div>
                              <code className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded">
                                {coupon.code}
                              </code>
                              {coupon.name && (
                                <p className="text-xs text-muted-foreground mt-1">{coupon.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getDiscountIcon(coupon.discount_type)}
                              <span className="font-medium">{formatDiscount(coupon)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {coupon.min_order_amount ? (
                              <span>${coupon.min_order_amount.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{coupon.usage_count}</span>
                            {coupon.usage_limit && (
                              <span className="text-muted-foreground"> / {coupon.usage_limit}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!coupon.is_active ? (
                              <Badge variant="secondary">Inactive</Badge>
                            ) : isExpired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : isLimitReached ? (
                              <Badge variant="outline">Limit Reached</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {coupon.expires_at ? (
                              new Date(coupon.expires_at).toLocaleDateString()
                            ) : (
                              'Never'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
