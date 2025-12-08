import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, Package, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Shipping Information | UV Coated Club Flyers',
  description: 'Learn about our shipping options, delivery times, and shipping policies.',
};

export default function ShippingPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">FedEx Ground</h4>
              <p className="text-sm text-muted-foreground">3-5 business days</p>
            </div>
            <div>
              <h4 className="font-semibold">FedEx 2-Day</h4>
              <p className="text-sm text-muted-foreground">2 business days</p>
            </div>
            <div>
              <h4 className="font-semibold">FedEx Overnight</h4>
              <p className="text-sm text-muted-foreground">Next business day</p>
            </div>
            <div>
              <h4 className="font-semibold">Southwest Cargo</h4>
              <p className="text-sm text-muted-foreground">Same-day airport pickup available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Processing Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Economy (2-4 Days)</h4>
              <p className="text-sm text-muted-foreground">Standard processing time</p>
            </div>
            <div>
              <h4 className="font-semibold">Fast (1-2 Days)</h4>
              <p className="text-sm text-muted-foreground">Priority processing</p>
            </div>
            <div>
              <h4 className="font-semibold">Faster (Tomorrow)</h4>
              <p className="text-sm text-muted-foreground">Rush processing</p>
            </div>
            <div>
              <h4 className="font-semibold">Crazy Fast (Today)</h4>
              <p className="text-sm text-muted-foreground">Same-day processing</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ship From Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All orders ship from our facility in Schaumburg, IL 60173.
              Shipping costs are calculated based on the destination address and package weight.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Packaging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All printed materials are carefully packaged to prevent damage during transit.
              Large orders may be split into multiple boxes for safe delivery.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground">
          If you have questions about shipping or need to track your order,
          please contact us at support@uvcoatedclubflyers.com
        </p>
      </div>
    </div>
  );
}
