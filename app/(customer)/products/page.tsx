import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ProductImage } from '@/components/product-image';

async function getProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: 'active',
    },
    orderBy: {
      name: 'asc',
    },
  });

  return products;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  return categories;
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-card">
        <div className="container-custom py-16">
          <h1 className="mb-4 text-center">Premium Printing Services</h1>
          <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground">
            Professional UV-coated flyers and marketing materials with exceptional quality and fast turnaround.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-background">
        <div className="container-custom py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select defaultValue="name-asc">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container-custom">
          <Suspense fallback={<ProductGridSkeleton />}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col transition-shadow hover:shadow-lg">
                  <Link href={`/products/${product.id}`} className="cursor-pointer">
                    <ProductImage
                      imageUrl={product.imageUrl}
                      productName={product.name}
                      variant="card"
                      className="rounded-t-lg border-b"
                    />
                  </Link>
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <Badge variant="secondary">
                        {product.category?.name || 'Uncategorized'}
                      </Badge>
                      {product.status === 'active' && (
                        <Badge variant="default">Available</Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          ${(product.basePrice / 100).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">starting</span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Starting from 100 units
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/products/${product.id}`} className="w-full">
                      <Button className="w-full">Configure & Order</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="py-16 text-center">
                <h2 className="mb-2">No products found</h2>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <div className="mb-2 h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </CardContent>
          <CardFooter>
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
