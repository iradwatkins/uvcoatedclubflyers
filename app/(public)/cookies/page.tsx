import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | UV Coated Club Flyers',
  description: 'Learn about how we use cookies and similar technologies on our website.',
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Cookie className="h-8 w-8" />
        Cookie Policy
      </h1>
      <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Cookies are small text files that are stored on your device when you visit
              a website. They help the website remember your preferences and improve your
              browsing experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground">Essential Cookies</h4>
              <p>
                These cookies are necessary for the website to function properly.
                They enable core functionality like shopping cart, user authentication,
                and checkout processing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Session Cookies</h4>
              <p>
                We use session cookies to maintain your cart across page visits.
                The cart_session cookie expires after 7 days of inactivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Authentication Cookies</h4>
              <p>
                If you create an account, we use cookies to keep you logged in
                and remember your preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies We Use</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cookie Name</th>
                  <th className="text-left py-2">Purpose</th>
                  <th className="text-left py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2">cart_session</td>
                  <td className="py-2">Shopping cart functionality</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">next-auth.session-token</td>
                  <td className="py-2">User authentication</td>
                  <td className="py-2">30 days</td>
                </tr>
                <tr>
                  <td className="py-2">__stripe_mid</td>
                  <td className="py-2">Payment processing</td>
                  <td className="py-2">1 year</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              We use Square for payment processing, which may set its own cookies
              for security and fraud prevention purposes. These cookies are governed
              by Square's own privacy policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managing Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              You can control and delete cookies through your browser settings.
              However, disabling essential cookies may affect the functionality
              of this website, including the ability to add items to cart and
              complete purchases.
            </p>
            <p className="mt-3">
              Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View what cookies are stored on your device</li>
              <li>Delete individual or all cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific websites</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              If you have questions about our use of cookies, please contact us at:<br />
              Email: support@uvcoatedclubflyers.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
