import { sql } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gift, TrendingUp, Eye, MousePointerClick } from 'lucide-react';

interface OrderBump {
  id: number;
  name: string;
  product_id: number | null;
  discount_type: string;
  discount_value: number;
  headline: string;
  checkbox_label: string;
  display_position: string;
  layout: string;
  is_active: boolean;
  priority: number;
  created_at: Date;
  product_name: string | null;
  product_base_price: number | null;
  impressions: number;
  conversions: number;
  revenue: number;
}

async function getOrderBumps(): Promise<OrderBump[]> {
  const bumps = await sql`
    SELECT
      ob.id,
      ob.name,
      ob.product_id,
      ob.discount_type,
      ob.discount_value,
      ob.headline,
      ob.checkbox_label,
      ob.display_position,
      ob.layout,
      ob.is_active,
      ob.priority,
      ob.created_at,
      p.name as product_name,
      p.base_price as product_base_price,
      COALESCE((SELECT COUNT(*) FROM order_bump_stats WHERE bump_id = ob.id AND event_type = 'impression'), 0)::int as impressions,
      COALESCE((SELECT COUNT(*) FROM order_bump_stats WHERE bump_id = ob.id AND event_type = 'conversion'), 0)::int as conversions,
      COALESCE((SELECT SUM(revenue) FROM order_bump_stats WHERE bump_id = ob.id AND event_type = 'conversion'), 0)::numeric as revenue
    FROM order_bumps ob
    LEFT JOIN products p ON ob.product_id = p.id
    ORDER BY ob.priority DESC, ob.created_at DESC
  `;
  return bumps as OrderBump[];
}

export default async function AdminOrderBumpsPage() {
  const bumps = await getOrderBumps();

  const activeBumps = bumps.filter((b) => b.is_active);
  const totalImpressions = bumps.reduce((sum, b) => sum + b.impressions, 0);
  const totalConversions = bumps.reduce((sum, b) => sum + b.conversions, 0);
  const totalRevenue = bumps.reduce((sum, b) => sum + Number(b.revenue || 0), 0);
  const avgConversionRate =
    totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Order Bumps</h1>
          <p className="text-muted-foreground">
            Increase average order value with checkout offers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Order Bump
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bumps</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bumps.length}</div>
            <p className="text-xs text-muted-foreground">{activeBumps.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{avgConversionRate}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue/Bump</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${bumps.length > 0 ? (totalRevenue / bumps.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bumps List */}
      <Card>
        <CardHeader>
          <CardTitle>All Order Bumps</CardTitle>
          <CardDescription>
            Manage your checkout offers and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bumps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No order bumps created yet. Create your first offer to increase average order value.
              </div>
            ) : (
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Bump</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Discount</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Impressions</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Conversions</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Conv. Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Revenue</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bumps.map((bump) => {
                      const conversionRate =
                        bump.impressions > 0
                          ? ((bump.conversions / bump.impressions) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <tr key={bump.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{bump.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {bump.headline}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {bump.product_name ? (
                              <div>
                                <p className="text-sm">{bump.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${Number(bump.product_base_price || 0).toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No product</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {bump.discount_type === 'none' ? (
                              <span className="text-muted-foreground">None</span>
                            ) : bump.discount_type === 'percentage' ? (
                              <Badge variant="secondary">{bump.discount_value}% off</Badge>
                            ) : (
                              <Badge variant="secondary">${Number(bump.discount_value || 0).toFixed(2)} off</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{bump.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{bump.conversions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                Number(conversionRate) > 5
                                  ? 'text-green-600 font-medium'
                                  : Number(conversionRate) > 2
                                    ? 'text-yellow-600'
                                    : 'text-muted-foreground'
                              }
                            >
                              {conversionRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${Number(bump.revenue || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {bump.is_active ? (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
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
