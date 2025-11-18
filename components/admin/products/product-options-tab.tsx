'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductOptionsTabProps {
  productId?: number;
}

export function ProductOptionsTab({ productId }: ProductOptionsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Add-ons</CardTitle>
          <CardDescription>
            Configure add-ons for this product. Add-ons will be built incrementally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Add-ons Configuration</p>
            <p className="text-sm">Add-ons will be configured one at a time. Coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
