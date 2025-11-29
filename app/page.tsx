import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Zap, Shield, Truck, Star, CheckCircle } from 'lucide-react';

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={session?.user || null} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Professional UV Coated
                <span className="block text-primary">Club Flyers</span>
              </h1>
              <p className="mb-8 text-lg text-gray-600 sm:text-xl md:text-2xl">
                Premium UV coated printing for clubs, events, and promotions. Fast turnaround,
                exceptional quality.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/products">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Products
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Us</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                We provide the highest quality printing services with unmatched customer support
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <Zap className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>Fast Turnaround</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Quick production and shipping to meet your tight deadlines
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Star className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>Premium Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    High-quality UV coating for vibrant, long-lasting flyers
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Multiple payment options including Square and PayPal
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Truck className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>Flexible Shipping</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    FedEx and Southwest Cargo options with real-time tracking
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Get your custom flyers in just a few simple steps
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Choose Your Product</h3>
                <p className="text-muted-foreground">
                  Select from our range of flyer sizes and configurations
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Upload Your Design</h3>
                <p className="text-muted-foreground">
                  Upload your artwork or use our design templates
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Receive Your Order</h3>
                <p className="text-muted-foreground">
                  We print, ship, and deliver right to your door
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-16 text-primary-foreground md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg opacity-90 sm:text-xl">
              Join thousands of satisfied customers and create your perfect flyers today
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white text-white hover:bg-white/10 sm:w-auto"
                >
                  View Products
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
