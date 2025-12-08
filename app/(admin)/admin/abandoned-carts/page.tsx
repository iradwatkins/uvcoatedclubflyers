import { sql } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Mail, RefreshCw, DollarSign, Percent } from 'lucide-react';

interface AbandonedCart {
  id: number;
  session_id: string;
  email: string | null;
  total_value: number; // in cents
  item_count: number;
  status: string;
  abandoned_at: Date | null;
  first_email_sent_at: Date | null;
  second_email_sent_at: Date | null;
  third_email_sent_at: Date | null;
  recovered_at: Date | null;
}

interface AbandonedCartStats {
  total_abandoned: number;
  total_recovered: number;
  abandoned_value: number; // in cents
  recovered_value: number; // in cents
  recovery_rate: number;
}

async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const carts = await sql`
    SELECT
      id,
      session_id,
      email,
      total_value,
      item_count,
      status,
      abandoned_at,
      first_email_sent_at,
      second_email_sent_at,
      third_email_sent_at,
      recovered_at
    FROM abandoned_carts
    WHERE status IN ('abandoned', 'recovered', 'expired')
    ORDER BY abandoned_at DESC
    LIMIT 100
  `;
  return carts as AbandonedCart[];
}

async function getStats(): Promise<AbandonedCartStats> {
  const [stats] = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired'))::int as total_abandoned,
      COUNT(*) FILTER (WHERE status = 'recovered')::int as total_recovered,
      COALESCE(SUM(total_value) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')), 0) as abandoned_value,
      COALESCE(SUM(total_value) FILTER (WHERE status = 'recovered'), 0) as recovered_value,
      CASE
        WHEN COUNT(*) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status = 'recovered')::numeric /
           COUNT(*) FILTER (WHERE status IN ('abandoned', 'recovered', 'expired')) * 100), 1
        )
        ELSE 0
      END as recovery_rate
    FROM abandoned_carts
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `) as AbandonedCartStats[];

  return stats || {
    total_abandoned: 0,
    total_recovered: 0,
    abandoned_value: 0,
    recovered_value: 0,
    recovery_rate: 0,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'recovered':
      return <Badge className="bg-green-100 text-green-700">Recovered</Badge>;
    case 'abandoned':
      return <Badge className="bg-yellow-100 text-yellow-700">Abandoned</Badge>;
    case 'active':
      return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expired</Badge>;
    case 'converted':
      return <Badge className="bg-green-100 text-green-700">Converted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getEmailsSentCount(cart: AbandonedCart): number {
  let count = 0;
  if (cart.first_email_sent_at) count++;
  if (cart.second_email_sent_at) count++;
  if (cart.third_email_sent_at) count++;
  return count;
}

export default async function AdminAbandonedCartsPage() {
  const [carts, stats] = await Promise.all([getAbandonedCarts(), getStats()]);

  // Convert values from cents to dollars for display
  const abandonedValueDollars = Number(stats.abandoned_value || 0) / 100;
  const recoveredValueDollars = Number(stats.recovered_value || 0) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Abandoned Cart Recovery</h1>
        <p className="text-muted-foreground">
          Track abandoned carts and recovery email performance (last 30 days)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_abandoned}</div>
            <p className="text-xs text-muted-foreground">
              ${abandonedValueDollars.toFixed(2)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovered</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_recovered}</div>
            <p className="text-xs text-muted-foreground">
              ${recoveredValueDollars.toFixed(2)} recovered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recovery_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.reduce((sum, cart) => sum + getEmailsSentCount(cart), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${(abandonedValueDollars - recoveredValueDollars).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">still recoverable</p>
          </CardContent>
        </Card>
      </div>

      {/* Abandoned Carts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Abandoned Carts</CardTitle>
          <CardDescription>
            Carts that were abandoned with items (email required for recovery)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No abandoned carts detected yet. Carts become "abandoned" after 30 minutes of inactivity
              when the customer has provided their email.
            </div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Cart Value</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Items</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Emails</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Abandoned</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map((cart) => (
                    <tr key={cart.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {cart.email || 'No email'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${(Number(cart.total_value) / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">{cart.item_count}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{getEmailsSentCount(cart)} / 3</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(cart.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {cart.abandoned_at
                          ? new Date(cart.abandoned_at).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
