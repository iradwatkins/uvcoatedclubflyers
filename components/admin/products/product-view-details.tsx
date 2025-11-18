import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/product-image';
import { CheckCircle2, XCircle, Star, Package, Calendar } from 'lucide-react';

interface ProductViewDetailsProps {
  product: {
    id: number;
    name: string;
    description: string | null;
    basePrice: number;
    sku: string | null;
    imageUrl: string | null;
    imageUrl2: string | null;
    imageUrl3: string | null;
    imageUrl4: string | null;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: number | null;
    quantities: string | null;
    sizes: string | null;
    availablePaperStocks: any;
    availableTurnarounds: any;
    createdAt: Date;
    updatedAt: Date;
    category?: { name: string } | null;
    productAddons?: Array<{
      addon: {
        id: number;
        name: string;
        slug: string;
      };
      isMandatory: boolean;
      isEnabled: boolean;
    }>;
    _count?: {
      orderItems: number;
    };
  };
}

export function ProductViewDetails({ product }: ProductViewDetailsProps) {
  const quantities = product.quantities?.split(',') || [];
  const sizes = product.sizes?.split(',') || [];
  const paperStocks = Array.isArray(product.availablePaperStocks) ? product.availablePaperStocks : [];
  const turnarounds = Array.isArray(product.availableTurnarounds) ? product.availableTurnarounds : [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {product.isActive ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
                {product.isFeatured && (
                  <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
                {product.category && (
                  <Badge variant="outline">{product.category.name}</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="text-3xl font-bold">${(product.basePrice / 100).toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {product.sku && (
              <div>
                <h4 className="text-sm font-medium mb-1">SKU</h4>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                <Package className="h-4 w-4" />
                Total Orders
              </h4>
              <p className="text-sm text-muted-foreground">
                {product._count?.orderItems || 0} order{(product._count?.orderItems || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Last Updated
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(product.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
          <CardDescription>All uploaded product images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {product.imageUrl && (
              <div>
                <ProductImage
                  imageUrl={product.imageUrl}
                  productName={product.name}
                  variant="default"
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">Primary</p>
              </div>
            )}
            {product.imageUrl2 && (
              <div>
                <ProductImage
                  imageUrl={product.imageUrl2}
                  productName={product.name}
                  variant="default"
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">Image 2</p>
              </div>
            )}
            {product.imageUrl3 && (
              <div>
                <ProductImage
                  imageUrl={product.imageUrl3}
                  productName={product.name}
                  variant="default"
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">Image 3</p>
              </div>
            )}
            {product.imageUrl4 && (
              <div>
                <ProductImage
                  imageUrl={product.imageUrl4}
                  productName={product.name}
                  variant="default"
                />
                <p className="text-xs text-center mt-1 text-muted-foreground">Image 4</p>
              </div>
            )}
          </div>
          {!product.imageUrl && (
            <p className="text-sm text-muted-foreground">No images uploaded</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quantities */}
        <Card>
          <CardHeader>
            <CardTitle>Available Quantities</CardTitle>
            <CardDescription>Quantity options for this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quantities.map((qty) => (
                <Badge key={qty} variant="outline">
                  {qty}
                </Badge>
              ))}
            </div>
            {quantities.length === 0 && (
              <p className="text-sm text-muted-foreground">No quantities configured</p>
            )}
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Available Sizes</CardTitle>
            <CardDescription>Size options for this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Badge key={size} variant="outline">
                  {size}
                </Badge>
              ))}
            </div>
            {sizes.length === 0 && (
              <p className="text-sm text-muted-foreground">No sizes configured</p>
            )}
          </CardContent>
        </Card>

        {/* Paper Stocks */}
        <Card>
          <CardHeader>
            <CardTitle>Paper Stocks</CardTitle>
            <CardDescription>Available paper stock options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {paperStocks.map((stockId: number) => (
                <Badge key={stockId} variant="outline">
                  Stock ID: {stockId}
                </Badge>
              ))}
            </div>
            {paperStocks.length === 0 && (
              <p className="text-sm text-muted-foreground">No paper stocks configured</p>
            )}
          </CardContent>
        </Card>

        {/* Turnarounds */}
        <Card>
          <CardHeader>
            <CardTitle>Turnaround Times</CardTitle>
            <CardDescription>Available turnaround options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {turnarounds.map((turnaroundId: number) => (
                <Badge key={turnaroundId} variant="outline">
                  Turnaround ID: {turnaroundId}
                </Badge>
              ))}
            </div>
            {turnarounds.length === 0 && (
              <p className="text-sm text-muted-foreground">No turnarounds configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Add-Ons</CardTitle>
          <CardDescription>Add-ons available for this product</CardDescription>
        </CardHeader>
        <CardContent>
          {product.productAddons && product.productAddons.length > 0 ? (
            <div className="space-y-2">
              {product.productAddons.map((pa) => (
                <div
                  key={pa.addon.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{pa.addon.name}</p>
                    <p className="text-sm text-muted-foreground">{pa.addon.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pa.isMandatory && (
                      <Badge variant="destructive" className="text-xs">
                        Mandatory
                      </Badge>
                    )}
                    {pa.isEnabled ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No add-ons assigned to this product</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
