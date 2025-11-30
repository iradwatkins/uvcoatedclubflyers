'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  image_url: string | null;
  fixed_width: string;
  fixed_height: string;
  fixed_sides: string;
  paper_stock_name: string;
  coating_name: string;
}

export function QuickProductsCarousel() {
  const [products, setProducts] = useState<QuickProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products/quick');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch quick products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Card width + gap
      const newPosition =
        direction === 'left'
          ? carouselRef.current.scrollLeft - scrollAmount
          : carouselRef.current.scrollLeft + scrollAmount;
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 w-72 flex-shrink-0 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold tracking-tight">Quick 9pt Sizes</h2>
          <Badge variant="secondary" className="ml-2">
            Fast Checkout
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Card
            key={product.id}
            className="min-w-[280px] max-w-[280px] flex-shrink-0 transition-shadow hover:shadow-lg"
          >
            <CardHeader className="pb-2">
              {/* Product Image Placeholder */}
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                <div className="text-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {product.fixed_width}×{product.fixed_height}
                  </span>
                  <span className="block text-sm text-muted-foreground">inches</span>
                </div>
              </div>
              <h3 className="font-semibold leading-tight">{product.name}</h3>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{product.paper_stock_name}</p>
                <p>{product.coating_name}</p>
                <p className="capitalize">{product.fixed_sides}-sided printing</p>
              </div>
              <p className="mt-2 text-lg font-bold text-primary">
                From ${parseFloat(product.base_price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/quick/${product.slug}`} className="w-full">
                <Button className="w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  Order Now
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center">
        <Link href="/products?category=quick-9pt-sizes">
          <Button variant="outline">View All Quick Sizes</Button>
        </Link>
      </div>
    </div>
  );
}
