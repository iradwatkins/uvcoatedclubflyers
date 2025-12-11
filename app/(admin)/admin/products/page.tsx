import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { ProductDeleteDialog } from '@/components/admin/products/product-delete-dialog';
import { ProductDuplicateButton } from '@/components/admin/products/product-duplicate-button';

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Product Management</h1>
          <p className="text-muted-foreground">Manage your products, pricing, and options</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.isActive).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.isFeatured).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p._count.orderItems, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>A list of all products in your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Image</th>
                  <th className="pb-3 text-left font-medium">Product</th>
                  <th className="pb-3 text-left font-medium">Category</th>
                  <th className="pb-3 text-left font-medium">Base Price</th>
                  <th className="pb-3 text-center font-medium">Status</th>
                  <th className="pb-3 text-center font-medium">Orders</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-4">
                      <ProductImage
                        imageUrl={product.imageUrl}
                        productName={product.name}
                        variant="mini"
                      />
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.isFeatured && (
                          <Badge variant="secondary" className="mt-1">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4">{product.category?.name || 'Uncategorized'}</td>
                    <td className="py-4">${(product.basePrice / 100).toFixed(2)}</td>
                    <td className="py-4 text-center">
                      {product.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-4 text-center">{product._count.orderItems}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={product.isQuickProduct ? `/quick/${product.slug}` : `/products/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </a>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <ProductDuplicateButton productId={product.id} productName={product.name} />
                        <ProductDeleteDialog
                          productId={product.id}
                          productName={product.name}
                          orderCount={product._count.orderItems}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No products found. Create your first product to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
