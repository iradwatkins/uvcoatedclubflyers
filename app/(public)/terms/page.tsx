import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Terms of Service | UV Coated Club Flyers',
  description: 'Read our terms of service and conditions for using our website and services.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              By accessing and using UV Coated Club Flyers website and services, you agree
              to be bound by these Terms of Service. If you do not agree to these terms,
              please do not use our services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Orders and Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>All orders are subject to acceptance and availability</li>
              <li>Prices are subject to change without notice</li>
              <li>Payment is required before production begins</li>
              <li>We accept major credit cards and Cash App Pay</li>
              <li>All prices are in US Dollars</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Artwork and Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>You are responsible for the accuracy of your artwork</li>
              <li>You warrant that you have the right to use all content submitted</li>
              <li>We are not liable for errors in customer-provided artwork</li>
              <li>We reserve the right to refuse printing inappropriate content</li>
              <li>Uploaded files are stored for order fulfillment only</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Production and Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Production times are estimates and not guaranteed</li>
              <li>Shipping times depend on carrier and destination</li>
              <li>We are not responsible for carrier delays</li>
              <li>Risk of loss passes to customer upon carrier pickup</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Returns and Refunds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Claims must be made within 7 days of delivery</li>
              <li>Refunds/reprints available for printing defects only</li>
              <li>Customer artwork errors are not eligible for refund</li>
              <li>Custom orders cannot be cancelled once production starts</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              UV Coated Club Flyers liability is limited to the amount paid for the order.
              We are not liable for indirect, incidental, or consequential damages.
              Minor color variations between screen and print are normal and not grounds
              for refund.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              All content on this website, including logos, graphics, and text, is the
              property of UV Coated Club Flyers. You may not reproduce, distribute, or
              create derivative works without our written permission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              We reserve the right to modify these terms at any time. Continued use of
              our services after changes constitutes acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              For questions about these Terms of Service, contact us at:<br />
              Email: support@uvcoatedclubflyers.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
