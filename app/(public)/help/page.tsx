import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, FileQuestion, Palette, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Help Center | UV Coated Club Flyers',
  description: 'Find answers to frequently asked questions about ordering, artwork, and more.',
};

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Ordering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">How do I place an order?</h4>
              <p className="text-sm text-muted-foreground">
                Select your product, choose your specifications (paper stock, coating, size, quantity),
                upload your artwork, and proceed to checkout.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Can I modify my order after placing it?</h4>
              <p className="text-sm text-muted-foreground">
                Orders can only be modified before they enter production. Contact us immediately
                if you need to make changes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express, Discover)
                and Cash App Pay.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Artwork & Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">What file formats do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept PDF, AI, EPS, PSD, JPG, PNG, and TIFF files. PDF is preferred
                for best results.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">What resolution should my artwork be?</h4>
              <p className="text-sm text-muted-foreground">
                For best print quality, artwork should be at least 300 DPI at the final
                print size.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Do you offer design services?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! We offer standard custom design (3-5 business days) and rush custom
                design (1-2 business days) services.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">How long does shipping take?</h4>
              <p className="text-sm text-muted-foreground">
                Shipping time depends on your selected method. FedEx Ground takes 3-5 days,
                2-Day takes 2 days, and Overnight delivers next business day.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Do you ship internationally?</h4>
              <p className="text-sm text-muted-foreground">
                Currently, we only ship within the United States. Contact us for
                special international shipping requests.
              </p>
            </div>
            <p className="text-sm">
              <Link href="/shipping" className="text-primary hover:underline">
                View full shipping information →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Returns & Refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">What is your return policy?</h4>
              <p className="text-sm text-muted-foreground">
                We offer refunds or reprints for printing defects, quality issues, or
                shipping damage. Claims must be made within 7 days of delivery.
              </p>
            </div>
            <p className="text-sm">
              <Link href="/returns" className="text-primary hover:underline">
                View full return policy →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5" />
          Still Need Help?
        </h3>
        <p className="text-sm text-muted-foreground">
          Contact our support team at{' '}
          <a href="mailto:support@uvcoatedclubflyers.com" className="text-primary hover:underline">
            support@uvcoatedclubflyers.com
          </a>
        </p>
      </div>
    </div>
  );
}
