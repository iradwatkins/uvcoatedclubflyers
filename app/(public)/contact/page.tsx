import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | UV Coated Club Flyers',
  description: 'Get in touch with our team for questions, quotes, or support.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For general inquiries and support:
            </p>
            <a
              href="mailto:support@uvcoatedclubflyers.com"
              className="text-primary hover:underline font-medium"
            >
              support@uvcoatedclubflyers.com
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Call us Monday - Friday:
            </p>
            <p className="font-medium">1-800-XXX-XXXX</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              UV Coated Club Flyers<br />
              1300 Basswood Road<br />
              Schaumburg, IL 60173
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Monday - Friday: 8:00 AM - 6:00 PM CST<br />
              Saturday: 9:00 AM - 2:00 PM CST<br />
              Sunday: Closed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Response Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We typically respond to all inquiries within 1-2 business hours during
            business hours. For urgent orders or rush requests, please mention
            "URGENT" in your email subject line.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
