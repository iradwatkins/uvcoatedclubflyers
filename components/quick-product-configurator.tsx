'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Zap, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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

// Sides options
const SIDES_OPTIONS = [
  { value: 'different-both', label: 'Different Image Both Sides', pricingValue: 'double' },
  { value: 'same-both', label: 'Same Image Both Sides', pricingValue: 'double' },
  { value: 'front-only', label: 'Image One Side Only', pricingValue: 'single' },
];

// Design options - pricing matches database add-ons (Standard Custom Design: $90 one side, $135 two sides)
const DESIGN_OPTIONS = [
  { value: 'upload', label: 'Upload Your Image', price: 0 },
  { value: 'design-service-one', label: 'Design Services - One Side (+$90)', price: 90 },
  { value: 'design-service-two', label: 'Design Services - Both Sides (+$135)', price: 135 },
];

// Format size - remove decimals for whole numbers
function formatSize(value: string): string {
  const num = parseFloat(value);
  return Number.isInteger(num) ? num.toString() : value;
}

export function QuickProductConfigurator({
  product,
  turnarounds,
}: QuickProductConfiguratorProps) {
  const router = useRouter();

  // State - default quantity is 5000
  const [selectedQuantity, setSelectedQuantity] = useState(5000);
  const [selectedSides, setSelectedSides] = useState('different-both');
  const [selectedDesign, setSelectedDesign] = useState('upload');
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState<number | null>(
    turnarounds[0]?.id || null
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [turnaroundPrices, setTurnaroundPrices] = useState<Record<number, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the pricing value for the selected sides option
  const selectedSidesOption = SIDES_OPTIONS.find((s) => s.value === selectedSides);
  const sidesForPricing = selectedSidesOption?.pricingValue || 'double';

  // Get design service fee
  const selectedDesignOption = DESIGN_OPTIONS.find((d) => d.value === selectedDesign);
  const designFee = selectedDesignOption?.price || 0;

  // Format sizes for display
  const formattedWidth = formatSize(product.fixed_width);
  const formattedHeight = formatSize(product.fixed_height);
  const sizeDisplay = `${formattedWidth}"×${formattedHeight}"`;

  // Calculate all prices for turnarounds
  const calculateAllPrices = useCallback(async () => {
    if (turnarounds.length === 0) return;

    setIsCalculating(true);
    setError(null);

    try {
      const width = parseFloat(product.fixed_width);
      const height = parseFloat(product.fixed_height);

      // Calculate prices for all turnarounds
      const prices: Record<number, number> = {};

      await Promise.all(
        turnarounds.map(async (turnaround) => {
          try {
            const response = await fetch('/api/products/calculate-price', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: product.id,
                paperStockId: product.fixed_paper_stock_id,
                coatingId: product.fixed_coating_id,
                turnaroundId: turnaround.id,
                quantity: selectedQuantity,
                width,
                height,
                sides: sidesForPricing,
                addOns: [],
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const data = result.data || result;
              prices[turnaround.id] = data.totalPrice || data.total || 0;
            } else {
              console.error(`Failed to get price for turnaround ${turnaround.id}`);
            }
          } catch (err) {
            console.error(`Error calculating price for turnaround ${turnaround.id}:`, err);
          }
        })
      );

      setTurnaroundPrices(prices);

      // Set the selected turnaround price immediately
      if (selectedTurnaroundId && prices[selectedTurnaroundId] !== undefined) {
        setCalculatedPrice(prices[selectedTurnaroundId]);
      } else if (turnarounds.length > 0 && prices[turnarounds[0].id] !== undefined) {
        // Fallback to first turnaround if selected one doesn't have price
        setCalculatedPrice(prices[turnarounds[0].id]);
      }
    } catch (error) {
      console.error('Failed to calculate prices:', error);
      setError('Failed to calculate prices. Please refresh the page.');
    } finally {
      setIsCalculating(false);
    }
  }, [product.id, product.fixed_width, product.fixed_height, product.fixed_paper_stock_id, product.fixed_coating_id, selectedQuantity, sidesForPricing, turnarounds, selectedTurnaroundId]);

  // Calculate price when configuration changes
  useEffect(() => {
    if (selectedQuantity >= 25 && turnarounds.length > 0) {
      calculateAllPrices();
    }
  }, [calculateAllPrices, selectedQuantity, turnarounds.length]);

  // Update selected price when turnaround changes
  useEffect(() => {
    if (selectedTurnaroundId && turnaroundPrices[selectedTurnaroundId]) {
      setCalculatedPrice(turnaroundPrices[selectedTurnaroundId]);
    }
  }, [selectedTurnaroundId, turnaroundPrices]);

  // Total price including design fee
  const totalPrice = calculatedPrice !== null ? calculatedPrice + designFee : null;

  // Upload files to server and return URLs
  const uploadFilesToServer = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        uploadedUrls.push(result.url);
      } else {
        throw new Error(`Failed to upload file: ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleAddToCart = async () => {
    if (!selectedTurnaroundId || selectedQuantity < 25 || totalPrice === null) return;

    setIsAddingToCart(true);
    setError(null);

    try {
      // Upload files if any
      let fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        fileUrls = await uploadFilesToServer(uploadedFiles);
      }

      const selectedTurnaround = turnarounds.find((t) => t.id === selectedTurnaroundId);

      // Prepare cart item
      const cartItem = {
        productId: product.id.toString(),
        productName: product.name,
        quantity: selectedQuantity,
        options: {
          size: sizeDisplay,
          paperStock: product.paper_stock_name,
          paperStockId: product.fixed_paper_stock_id,
          coating: product.coating_name,
          coatingId: product.fixed_coating_id,
          sides: selectedSidesOption?.label || 'Different Image Both Sides',
          sidesValue: selectedSides,
          turnaround: selectedTurnaround?.name,
          turnaroundId: selectedTurnaroundId,
          productionDays: selectedTurnaround?.production_days,
          designOption: selectedDesignOption?.label,
          designFee: designFee,
          designFiles: fileUrls,
        },
        price: totalPrice,
        unitPrice: totalPrice / selectedQuantity,
        uploadedFiles: fileUrls,
        addOns: designFee > 0 ? [{ name: selectedDesign === 'design-service-one' ? 'Standard Custom Design (One Side)' : 'Standard Custom Design (Both Sides)', price: designFee }] : [],
      };

      // Add to cart via API
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to cart');
      }

      // Redirect to cart
      router.push('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const selectedTurnaround = turnarounds.find((t) => t.id === selectedTurnaroundId);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left Column - Product Info & Configuration */}
      <div className="space-y-6">
        {/* Product Image Only */}
        <Card>
          <CardContent className="p-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-6xl font-bold text-muted-foreground/30">
                    {formattedWidth}×{formattedHeight}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary">Quick Order</Badge>
            </div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <p className="text-muted-foreground">{product.description}</p>
          </CardHeader>
        </Card>

        {/* Configuration Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure Your Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quantity Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Select
                value={selectedQuantity.toString()}
                onValueChange={(value) => setSelectedQuantity(parseInt(value))}
              >
                <SelectTrigger id="quantity">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITY_OPTIONS.map((qty) => (
                    <SelectItem key={qty} value={qty.toString()}>
                      {qty.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size (Disabled) */}
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select disabled value="fixed">
                <SelectTrigger id="size" className="bg-muted/50">
                  <SelectValue>{sizeDisplay}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{sizeDisplay}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper Stock (Disabled) */}
            <div className="space-y-2">
              <Label htmlFor="paper-stock">Paper Stock</Label>
              <Select disabled value="fixed">
                <SelectTrigger id="paper-stock" className="bg-muted/50">
                  <SelectValue>{product.paper_stock_name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{product.paper_stock_name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Coating (Disabled) */}
            <div className="space-y-2">
              <Label htmlFor="coating">Coating</Label>
              <Select disabled value="fixed">
                <SelectTrigger id="coating" className="bg-muted/50">
                  <SelectValue>{product.coating_name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{product.coating_name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sides (Selectable) */}
            <div className="space-y-2">
              <Label htmlFor="sides">Sides</Label>
              <Select value={selectedSides} onValueChange={setSelectedSides}>
                <SelectTrigger id="sides">
                  <SelectValue placeholder="Select printing sides" />
                </SelectTrigger>
                <SelectContent>
                  {SIDES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Design Option */}
            <div className="space-y-2">
              <Label htmlFor="design">Design</Label>
              <Select value={selectedDesign} onValueChange={setSelectedDesign}>
                <SelectTrigger id="design">
                  <SelectValue placeholder="Select design option" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload - Show when "Upload Your Image" is selected or design service for reference */}
            {(selectedDesign === 'upload' || selectedDesign.startsWith('design-service')) && (
              <div className="space-y-2">
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
              </div>
            )}

          </CardContent>
        </Card>

        {/* Turnaround Selection - Inline Radio Group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedTurnaroundId?.toString() || ''}
              onValueChange={(value) => setSelectedTurnaroundId(parseInt(value))}
              className="space-y-2"
            >
              {turnarounds.map((turnaround) => {
                const price = turnaroundPrices[turnaround.id];
                const displayPrice = price !== undefined ? price + designFee : undefined;
                return (
                  <div
                    key={turnaround.id}
                    className={cn(
                      'flex items-center justify-between py-3 px-4 rounded-md cursor-pointer transition-colors',
                      selectedTurnaroundId === turnaround.id
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedTurnaroundId(turnaround.id)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={turnaround.id.toString()}
                        id={`turnaround-${turnaround.id}`}
                      />
                      <Label
                        htmlFor={`turnaround-${turnaround.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {turnaround.name}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({turnaround.production_days} business days)
                        </span>
                      </Label>
                    </div>
                    <div className="text-right">
                      {isCalculating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : displayPrice !== undefined ? (
                        <span className="font-bold">${displayPrice.toFixed(2)}</span>
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
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:sticky lg:top-8 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Product Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{sizeDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{selectedQuantity.toLocaleString()}</span>
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
                <span>{selectedSidesOption?.label || 'Different Image Both Sides'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Design</span>
                <span>{selectedDesign === 'upload' ? 'Upload Your Image' : 'Design Services'}</span>
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
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready to upload
                </span>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              {isCalculating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : totalPrice !== null ? (
                <span className="text-primary">${totalPrice.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground">--</span>
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
                selectedQuantity < 25 ||
                !selectedTurnaroundId ||
                totalPrice === null
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
