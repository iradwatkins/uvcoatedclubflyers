'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package } from 'lucide-react';

interface ProductPerformanceProps {
  products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export function ProductPerformance({ products }: ProductPerformanceProps) {
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Products
          </CardTitle>
          <CardDescription>Products ranked by revenue generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product, index) => {
              const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;

              return (
                <div key={product.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity.toLocaleString()} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(product.revenue / 100).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Products Sold</span>
            <Badge variant="secondary">
              {products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()} units
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <Badge>
              ${(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Top Product</span>
            <span className="text-sm font-medium">{products[0]?.name}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Revenue/Product</span>
              <span className="font-medium">
                ${products.length > 0 ? (totalRevenue / products.length / 100).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Units/Product</span>
              <span className="font-medium">
                {products.length > 0
                  ? Math.round(products.reduce((sum, p) => sum + p.quantity, 0) / products.length)
                  : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
