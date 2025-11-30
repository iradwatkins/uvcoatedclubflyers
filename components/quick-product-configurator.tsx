'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadDropzone } from '@/components/file-upload-dropzone';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Zap, Clock, CheckCircle, Loader2 } from 'lucide-react';
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
  fixed_paper_stock_id: number;
  fixed_coating_id: number;
  paper_stock_name: string;
  coating_name: string;
}

interface Turnaround {
  id: number;
  name: string;
  slug: string;
  description: string;
  production_days: number;
  category: string;
}

interface QuickProductConfiguratorProps {
  product: QuickProduct;
  turnarounds: Turnaround[];
}

// Standard quantity options
const QUANTITY_OPTIONS = [25, 50, 100, 250, 500, 1000, 2500, 5000];

export function QuickProductConfigurator({
  product,
  turnarounds,
}: QuickProductConfiguratorProps) {
  // State
  const [selectedQuantity, setSelectedQuantity] = useState(1000);
  const [customQuantity, setCustomQuantity] = useState('');
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState<number | null>(
    turnarounds[0]?.id || null
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [turnaroundPrices, setTurnaroundPrices] = useState<Record<number, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Effective quantity
  const effectiveQuantity =
    selectedQuantity === 0 ? parseInt(customQuantity) || 0 : selectedQuantity;

  // Calculate price when configuration changes
  useEffect(() => {
    if (effectiveQuantity >= 25) {
      calculateAllPrices();
    }
  }, [effectiveQuantity, product.id]);

  const calculateAllPrices = async () => {
    setIsCalculating(true);
    try {
      const width = parseFloat(product.fixed_width);
      const height = parseFloat(product.fixed_height);

      // Calculate prices for all turnarounds
      const prices: Record<number, number> = {};

      await Promise.all(
        turnarounds.map(async (turnaround) => {
          const response = await fetch('/api/products/calculate-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.id,
              paperStockId: product.fixed_paper_stock_id,
              coatingId: product.fixed_coating_id,
              turnaroundId: turnaround.id,
              quantity: effectiveQuantity,
              width,
              height,
              sides: product.fixed_sides,
              addOns: [],
            }),
          });

          if (response.ok) {
            const result = await response.json();
            const data = result.data || result;
            prices[turnaround.id] = data.totalPrice || data.total || 0;
          }
        })
      );

      setTurnaroundPrices(prices);

      // Set the selected turnaround price
      if (selectedTurnaroundId && prices[selectedTurnaroundId]) {
        setCalculatedPrice(prices[selectedTurnaroundId]);
      }
    } catch (error) {
      console.error('Failed to calculate prices:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Update selected price when turnaround changes
  useEffect(() => {
    if (selectedTurnaroundId && turnaroundPrices[selectedTurnaroundId]) {
      setCalculatedPrice(turnaroundPrices[selectedTurnaroundId]);
    }
  }, [selectedTurnaroundId, turnaroundPrices]);

  const handleAddToCart = async () => {
    if (!selectedTurnaroundId || effectiveQuantity < 25) return;

    setIsAddingToCart(true);
    try {
      // TODO: Implement actual cart functionality
      // For now, just simulate adding to cart
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Added to cart! (Cart functionality coming soon)');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const selectedTurnaround = turnarounds.find((t) => t.id === selectedTurnaroundId);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left Column - Product Info & Configuration */}
      <div className="space-y-6">
        {/* Product Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary">Quick Order</Badge>
            </div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <p className="text-muted-foreground">{product.description}</p>
          </CardHeader>
          <CardContent>
            {/* Fixed Specs */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-semibold">
                  {product.fixed_width}" × {product.fixed_height}"
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paper Stock</p>
                <p className="font-semibold">{product.paper_stock_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coating</p>
                <p className="font-semibold">{product.coating_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Printing</p>
                <p className="font-semibold capitalize">{product.fixed_sides}-Sided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Quantity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {QUANTITY_OPTIONS.map((qty) => (
                <Button
                  key={qty}
                  variant={selectedQuantity === qty ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => {
                    setSelectedQuantity(qty);
                    setCustomQuantity('');
                  }}
                >
                  {qty.toLocaleString()}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant={selectedQuantity === 0 ? 'default' : 'outline'}
                onClick={() => setSelectedQuantity(0)}
              >
                Custom
              </Button>
              {selectedQuantity === 0 && (
                <Input
                  type="number"
                  placeholder="Enter quantity (min 25)"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  min={25}
                  className="flex-1"
                />
              )}
            </div>

            {effectiveQuantity > 0 && effectiveQuantity < 25 && (
              <p className="text-sm text-destructive">Minimum quantity is 25</p>
            )}
          </CardContent>
        </Card>

        {/* Turnaround Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedTurnaroundId?.toString() || ''}
              onValueChange={(value) => setSelectedTurnaroundId(parseInt(value))}
              className="space-y-3"
            >
              {turnarounds.map((turnaround) => {
                const price = turnaroundPrices[turnaround.id];
                return (
                  <div
                    key={turnaround.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors',
                      selectedTurnaroundId === turnaround.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedTurnaroundId(turnaround.id)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={turnaround.id.toString()}
                        id={`turnaround-${turnaround.id}`}
                      />
                      <div>
                        <Label
                          htmlFor={`turnaround-${turnaround.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {turnaround.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {turnaround.description || `${turnaround.production_days} business days`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCalculating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : price !== undefined ? (
                        <span className="font-bold text-lg">${price.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Your Design</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadDropzone
              onFilesSelected={setUploadedFiles}
              maxFiles={4}
              acceptedFileTypes={[
                '.jpg',
                '.jpeg',
                '.png',
                '.pdf',
                '.ai',
                '.eps',
                '.psd',
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:sticky lg:top-8 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>
                  {product.fixed_width}" × {product.fixed_height}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{effectiveQuantity > 0 ? effectiveQuantity.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paper</span>
                <span>{product.paper_stock_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coating</span>
                <span>{product.coating_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Printing</span>
                <span className="capitalize">{product.fixed_sides}-Sided</span>
              </div>
            </div>

            <Separator />

            {/* Turnaround */}
            {selectedTurnaround && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedTurnaround.name}</span>
              </div>
            )}

            {/* Files */}
            {uploadedFiles.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                </span>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                {isCalculating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : calculatedPrice !== null ? (
                  <span className="text-primary">${calculatedPrice.toFixed(2)}</span>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </div>
              {effectiveQuantity > 0 && calculatedPrice !== null && (
                <p className="text-sm text-muted-foreground text-right">
                  ${(calculatedPrice / effectiveQuantity).toFixed(4)} per piece
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              disabled={
                isAddingToCart ||
                isCalculating ||
                effectiveQuantity < 25 ||
                !selectedTurnaroundId ||
                calculatedPrice === null
              }
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure checkout • Multiple payment options
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
