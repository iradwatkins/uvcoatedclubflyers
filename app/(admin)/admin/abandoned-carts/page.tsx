import { sql } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Mail, RefreshCw, DollarSign, Percent } from 'lucide-react';

interface AbandonedCart {
  id: number;
  session_id: string;
  email: string | null;
  first_name: string | null;
  cart_total: number;
  item_count: number;
  recovery_status: string;
  emails_sent: number;
  last_activity_at: Date;
  abandonment_detected_at: Date | null;
  recovered_at: Date | null;
}

interface AbandonedCartStats {
  total_abandoned: number;
  total_recovered: number;
  abandoned_value: number;
  recovered_value: number;
  total_emails_sent: number;
  recovery_rate: number;
}

async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const carts = await sql`
    SELECT
      id,
      session_id,
      email,
      first_name,
      cart_total,
      item_count,
      recovery_status,
      emails_sent,
      last_activity_at,
      abandonment_detected_at,
      recovered_at
    FROM abandoned_carts
    WHERE abandonment_detected_at IS NOT NULL
    ORDER BY abandonment_detected_at DESC
    LIMIT 100
  `;
  return carts as AbandonedCart[];
}

async function getStats(): Promise<AbandonedCartStats> {
  const [stats] = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE abandonment_detected_at IS NOT NULL)::int as total_abandoned,
      COUNT(*) FILTER (WHERE recovery_status = 'recovered')::int as total_recovered,
      COALESCE(SUM(cart_total) FILTER (WHERE abandonment_detected_at IS NOT NULL), 0) as abandoned_value,
      COALESCE(SUM(cart_total) FILTER (WHERE recovery_status = 'recovered'), 0) as recovered_value,
      COALESCE(SUM(emails_sent), 0)::int as total_emails_sent,
      CASE
        WHEN COUNT(*) FILTER (WHERE abandonment_detected_at IS NOT NULL) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE recovery_status = 'recovered')::numeric /
           COUNT(*) FILTER (WHERE abandonment_detected_at IS NOT NULL) * 100), 1
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
    total_emails_sent: 0,
    recovery_rate: 0,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'recovered':
      return <Badge className="bg-green-100 text-green-700">Recovered</Badge>;
    case 'email_sent':
      return <Badge className="bg-blue-100 text-blue-700">Email Sent</Badge>;
    case 'email_scheduled':
      return <Badge className="bg-yellow-100 text-yellow-700">Scheduled</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expired</Badge>;
    case 'unsubscribed':
      return <Badge variant="destructive">Unsubscribed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function AdminAbandonedCartsPage() {
  const [carts, stats] = await Promise.all([getAbandonedCarts(), getStats()]);

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
              ${Number(stats.abandoned_value || 0).toFixed(2)} total value
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
              ${Number(stats.recovered_value || 0).toFixed(2)} recovered
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
            <div className="text-2xl font-bold">{stats.total_emails_sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${(Number(stats.abandoned_value || 0) - Number(stats.recovered_value || 0)).toFixed(2)}
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
                        <div>
                          {cart.first_name && (
                            <p className="font-medium">{cart.first_name}</p>
                          )}
                          <p className={`text-sm ${cart.first_name ? 'text-muted-foreground' : ''}`}>
                            {cart.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${Number(cart.cart_total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">{cart.item_count}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{cart.emails_sent} / 3</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(cart.recovery_status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {cart.abandonment_detected_at
                          ? new Date(cart.abandonment_detected_at).toLocaleString()
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
