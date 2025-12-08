import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Returns & Refunds | UV Coated Club Flyers',
  description: 'Learn about our return policy and refund process.',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Returns & Refunds</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Our Commitment to Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            At UV Coated Club Flyers, we stand behind the quality of our products.
            If there's an issue with your order, we're here to make it right.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Eligible for Refund/Reprint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Printing defects or quality issues</li>
              <li>Wrong paper stock used</li>
              <li>Wrong coating applied</li>
              <li>Incorrect quantity received</li>
              <li>Damaged during shipping</li>
              <li>Color significantly different from proof</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Not Eligible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Customer-provided artwork errors</li>
              <li>Typos or spelling mistakes in artwork</li>
              <li>Minor color variations (within industry standards)</li>
              <li>Orders older than 30 days</li>
              <li>Custom/rush orders once production starts</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How to Request a Return
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Contact us within 7 days of receiving your order</li>
            <li>Provide your order number and photos of the issue</li>
            <li>Our team will review your request within 1-2 business days</li>
            <li>If approved, we'll offer a reprint or refund</li>
          </ol>
          <p className="text-sm font-medium mt-4">
            Contact: support@uvcoatedclubflyers.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
