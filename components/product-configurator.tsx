'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Check, Info } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';

interface ProductConfiguratorProps {
  product: any;
}

export function ProductConfigurator({ product }: ProductConfiguratorProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(100);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [price, setPrice] = useState(product.basePrice);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group options by type
  const groupedOptions = (product.productOptions || []).reduce((acc: any, option: any) => {
    if (!acc[option.optionType]) {
      acc[option.optionType] = [];
    }
    acc[option.optionType].push(option);
    return acc;
  }, {});

  // Initialize default options
  useEffect(() => {
    const defaults: Record<string, string> = {};
    Object.keys(groupedOptions).forEach((optionType) => {
      const defaultOption = groupedOptions[optionType].find((opt: any) => opt.isDefault);
      if (defaultOption) {
        defaults[optionType] = defaultOption.id.toString();
      } else if (groupedOptions[optionType].length > 0) {
        defaults[optionType] = groupedOptions[optionType][0].id.toString();
      }
    });
    setSelectedOptions(defaults);
  }, [product]);

  // Calculate price based on quantity and options
  useEffect(() => {
    calculatePrice();
  }, [quantity, selectedOptions]);

  const calculatePrice = () => {
    setIsCalculating(true);

    try {
      let basePrice = product.basePrice;

      // Apply option modifiers
      let modifierTotal = 0;
      Object.values(selectedOptions).forEach((optionId) => {
        const option = (product.productOptions || []).find((opt: any) => opt.id.toString() === optionId);
        if (option && option.priceModifier) {
          modifierTotal += parseFloat(option.priceModifier);
        }
      });

      const totalPrice = (basePrice + modifierTotal) * quantity;
      setPrice(totalPrice);
      setError(null);
    } catch (err) {
      console.error('Price calculation error:', err);
      setError('Unable to calculate price. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const cartItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        options: selectedOptions,
        price,
        unitPrice: Math.round(price / quantity),
      };

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItem),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      router.push('/cart');
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Failed to add to cart. Please try again.');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const unitPrice = Math.round(price / quantity);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Product Info */}
      <div className="space-y-6">
        {/* Hero Image */}
        <ProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          variant="hero"
          priority
          className="shadow-lg"
        />

        <div>
          <Badge variant="secondary" className="mb-4">
            {product.category?.name}
          </Badge>
          <h1 className="mb-4">{product.name}</h1>
          <p className="text-lg text-muted-foreground">{product.description}</p>
        </div>

        {product.specifications && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(product.specifications as Record<string, any>).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Premium UV coating for durability and vibrant colors</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Professional offset printing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Fast turnaround time</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Quality guaranteed</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Configurator */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Order</CardTitle>
            <CardDescription>
              Select your options and quantity below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 1. Quantity (Dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Select
                value={quantity.toString()}
                onValueChange={(value) => setQuantity(parseInt(value))}
              >
                <SelectTrigger id="quantity">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1,000</SelectItem>
                  <SelectItem value="2500">2,500</SelectItem>
                  <SelectItem value="5000">5,000</SelectItem>
                  <SelectItem value="10000">10,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Size */}
            {groupedOptions.size && (
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={selectedOptions.size || ''}
                  onValueChange={(value) => {
                    setSelectedOptions((prev) => ({ ...prev, size: value }));
                  }}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedOptions.size.map((option: any) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.optionValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 3. Paper Stock (Material) */}
            {groupedOptions.material && (
              <div className="space-y-2">
                <Label htmlFor="material">Paper Stock</Label>
                <Select
                  value={selectedOptions.material || ''}
                  onValueChange={(value) => {
                    setSelectedOptions((prev) => ({ ...prev, material: value }));
                  }}
                >
                  <SelectTrigger id="material">
                    <SelectValue placeholder="Select paper stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedOptions.material.map((option: any) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.optionValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 4. Sides */}
            {groupedOptions.sides && (
              <div className="space-y-2">
                <Label htmlFor="sides">Sides</Label>
                <Select
                  value={selectedOptions.sides || ''}
                  onValueChange={(value) => {
                    setSelectedOptions((prev) => ({ ...prev, sides: value }));
                  }}
                >
                  <SelectTrigger id="sides">
                    <SelectValue placeholder="Select sides" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedOptions.sides.map((option: any) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.optionValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 5. Coating */}
            {groupedOptions.coating && (
              <div className="space-y-2">
                <Label htmlFor="coating">Coating</Label>
                <Select
                  value={selectedOptions.coating || ''}
                  onValueChange={(value) => {
                    setSelectedOptions((prev) => ({ ...prev, coating: value }));
                  }}
                >
                  <SelectTrigger id="coating">
                    <SelectValue placeholder="Select coating" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedOptions.coating.map((option: any) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.optionValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 6. Turnaround Time (Button Selection) */}
            {groupedOptions.turnaround && (
              <div className="space-y-3">
                <Label>Turnaround Time</Label>
                <div className="grid grid-cols-1 gap-2">
                  {groupedOptions.turnaround.map((option: any) => {
                    const isSelected = selectedOptions.turnaround === option.id.toString();
                    const priceModifier = parseFloat(option.priceModifier) || 0;

                    return (
                      <Button
                        key={option.id}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'h-auto justify-start p-4 text-left',
                          isSelected && 'ring-2 ring-primary'
                        )}
                        onClick={() => {
                          setSelectedOptions((prev) => ({ ...prev, turnaround: option.id.toString() }));
                        }}
                      >
                        <div className="flex flex-1 items-center justify-between">
                          <span className="font-medium">{option.optionValue}</span>
                          {priceModifier !== 0 && (
                            <span className={cn(
                              'text-sm',
                              isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                            )}>
                              {priceModifier > 0 ? '+' : ''}
                              {formatPrice(Math.round(priceModifier * 100))}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4">
            {/* Price Summary */}
            <div className="w-full space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unit Price:</span>
                <span className="font-medium">
                  {isCalculating ? 'Calculating...' : formatPrice(unitPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity:</span>
                <span className="font-medium">{quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {isCalculating ? 'Calculating...' : formatPrice(price)}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={isCalculating || quantity < (product.minQuantity || 1)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
