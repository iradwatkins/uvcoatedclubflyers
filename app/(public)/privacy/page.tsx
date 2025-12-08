import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy | UV Coated Club Flyers',
  description: 'Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through Square)</li>
              <li>Order history and preferences</li>
              <li>Uploaded artwork and design files</li>
              <li>Communications with our support team</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders</li>
              <li>Send promotional emails (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Prevent fraud and maintain security</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Shipping carriers (FedEx, Southwest Cargo) to deliver your orders</li>
              <li>Payment processors (Square) to process transactions</li>
              <li>Service providers who assist in our operations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              We implement appropriate security measures to protect your personal information.
              Payment information is encrypted and processed securely through Square.
              Uploaded artwork files are stored securely and only accessed for order fulfillment.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at support@uvcoatedclubflyers.com
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              Email: support@uvcoatedclubflyers.com<br />
              Address: 1300 Basswood Road, Schaumburg, IL 60173
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
