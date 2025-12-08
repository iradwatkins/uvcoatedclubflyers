'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Check, Info, Loader2, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { FileUploadDropzone } from '@/components/file-upload-dropzone';
import { cn } from '@/lib/utils';
import { SIDES_OPTIONS } from '@/lib/pricing/paper-stock-coatings';
import { AddOnWithSubOptions } from '@/components/addons/addon-with-sub-options';
import { AddOnSubOptionConfig } from '@/components/addons/addon-sub-option-field';
import {
  AddOnCategorySection,
  categorizeAddOns,
  ADDON_CATEGORIES,
} from '@/components/addons/addon-category-section';
import { DesignOptionSelector } from '@/components/design-option-selector';
import {
  getRequiredAddOns,
  checkAddOnConflicts,
  validateSizeRequirements,
  validateRequiredSubOptions,
} from '@/lib/addons/addon-dependencies';

// ========================================
// TYPES
// ========================================

interface PaperStock {
  id: number;
  name: string;
  description: string;
  coatings: Coating[];
}

interface Coating {
  id: number;
  name: string;
  description: string;
}

interface StandardSize {
  id: number;
  name: string;
  width: number;
  height: number;
  is_default: boolean;
}

interface Turnaround {
  id: number;
  name: string;
  description: string;
  category: string;
  production_days: number;
}

interface AddOn {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  base_price: string;
  per_unit_price: string;
  percentage: string;
  ui_component: string;
  position: string;
  is_mandatory: boolean;
  is_enabled: boolean;
  display_order: number;
  subOptions?: AddOnSubOptionConfig[];
}

interface PricingOptions {
  product: any;
  paperStocks: PaperStock[];
  turnarounds: Turnaround[];
  quantities: number[];
  sizes: StandardSize[];
  addOns: {
    above_upload: AddOn[];
    below_upload: AddOn[];
  };
}

interface PriceBreakdown {
  totalPrice: number;
  unitPrice: number;
  baseCost: number;
  markupAmount: number;
  subtotal: number;
  paperStock: string;
  coating: string;
  turnaround: string;
  quantity: number;
  size: string;
  // Enhanced breakdown details
  squareInches?: number;
  sidesMultiplier?: number;
  turnaroundMultiplier?: number;
  addOnsCost?: number;
  addOnsDetails?: Array<{ name: string; cost: number }>;
  discountAmount?: number;
}

interface ProductConfiguratorNewProps {
  productId: number;
}

// ========================================
// COMPONENT
// ========================================

export function ProductConfiguratorNew({ productId }: ProductConfiguratorNewProps) {
  const router = useRouter();

  // Loading states
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pricing options from API
  const [options, setOptions] = useState<PricingOptions | null>(null);

  // Selected configuration
  const [selectedPaperStockId, setSelectedPaperStockId] = useState<number | null>(null);
  const [selectedCoatingId, setSelectedCoatingId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedTurnaroundId, setSelectedTurnaroundId] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(5000); // Default 5000
  const [customQuantity, setCustomQuantity] = useState<string>(''); // Custom quantity input
  const [customWidth, setCustomWidth] = useState<string>(''); // Custom width input
  const [customHeight, setCustomHeight] = useState<string>(''); // Custom height input
  const [selectedSides, setSelectedSides] = useState<string>('same-both'); // Default: Same Image Both Sides

  // Design & Files state
  const [selectedDesignOptionId, setSelectedDesignOptionId] = useState<number | null>(null); // Selected design option ID
  const [designOptionSides, setDesignOptionSides] = useState<string>(''); // For custom design sides selection
  const [designOptionFiles, setDesignOptionFiles] = useState<File[]>([]); // Files for design options
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]); // Track uploaded file IDs

  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]); // Track selected add-on IDs (for below_upload only)
  const [addOnSubOptions, setAddOnSubOptions] = useState<Record<number, Record<string, any>>>({}); // Track sub-option values by add-on ID
  const [additionalOptionsExpanded, setAdditionalOptionsExpanded] = useState(true); // Additional Options section collapse state

  // Calculated price
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  // Prices for all turnaround options (for comparison display)
  const [turnaroundPrices, setTurnaroundPrices] = useState<Record<number, { total: number; unit: number }>>({});
  const [isCalculatingTurnarounds, setIsCalculatingTurnarounds] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get available coatings based on selected paper stock
  const availableCoatings = selectedPaperStockId
    ? options?.paperStocks.find((ps) => ps.id === selectedPaperStockId)?.coatings || []
    : [];

  // ========================================
  // LOAD PRICING OPTIONS
  // ========================================

  useEffect(() => {
    loadPricingOptions();
  }, [productId]);

  const loadPricingOptions = async () => {
    setIsLoadingOptions(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}/pricing-options`);
      if (!response.ok) {
        throw new Error('Failed to load pricing options');
      }

      const result = await response.json();
      // Handle nested response structure (data.data vs data)
      const data: PricingOptions = result.data || result;
      setOptions(data);

      // Set defaults from product or first available
      const defaultPaperStock = data.product?.default_paper_stock_id || data.paperStocks[0]?.id;
      const defaultCoating = data.product?.default_coating_id;
      const defaultTurnaround = data.product?.default_turnaround_id || data.turnarounds[0]?.id;
      const defaultSize = data.sizes?.find((s) => s.is_default)?.id || data.sizes[0]?.id;

      setSelectedPaperStockId(defaultPaperStock);
      setSelectedTurnaroundId(defaultTurnaround);
      setSelectedSizeId(defaultSize);

      // Set default coating if valid for selected paper stock
      const paperStock = data.paperStocks.find((ps) => ps.id === defaultPaperStock);

      if (defaultCoating && paperStock?.coatings.some((c) => c.id === defaultCoating)) {
        // Use product's default coating if it's valid
        setSelectedCoatingId(defaultCoating);
      } else {
        // For 12pt, 14pt, 16pt C2S Cardstock, default to UV Both Sides (coating ID 5)
        const uvBothSidesCardstocks = [2, 5, 7]; // 16pt, 12pt, 14pt
        const uvBothSidesCoating = paperStock?.coatings.find((c) => c.id === 5);

        if (
          defaultPaperStock &&
          uvBothSidesCardstocks.includes(defaultPaperStock) &&
          uvBothSidesCoating
        ) {
          setSelectedCoatingId(5); // High Gloss UV Both Sides
        } else {
          // For other paper stocks, use first available coating
          setSelectedCoatingId(paperStock?.coatings[0]?.id || null);
        }
      }
    } catch (err) {
      console.error('Error loading pricing options:', err);
      setError('Unable to load product options. Please try again.');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // ========================================
  // CALCULATE PRICE
  // ========================================

  // Get effective quantity (custom or selected)
  const effectiveQuantity = selectedQuantity === 0
    ? (parseInt(customQuantity) || 0)
    : selectedQuantity;

  // Get effective width/height (custom or from selected size)
  const getEffectiveSize = () => {
    if (selectedSizeId === 0) {
      return {
        width: parseFloat(customWidth) || 0,
        height: parseFloat(customHeight) || 0,
      };
    }
    const size = options?.sizes.find((s) => s.id === selectedSizeId);
    return size ? { width: size.width, height: size.height } : { width: 0, height: 0 };
  };

  useEffect(() => {
    const { width, height } = getEffectiveSize();
    if (
      selectedPaperStockId &&
      selectedCoatingId &&
      (selectedSizeId || (width > 0 && height > 0)) &&
      selectedTurnaroundId &&
      effectiveQuantity >= 25
    ) {
      calculatePrice();
    }
  }, [
    selectedPaperStockId,
    selectedCoatingId,
    selectedSizeId,
    selectedTurnaroundId,
    selectedQuantity,
    customQuantity,
    customWidth,
    customHeight,
    selectedSides,
    selectedAddOns,
    addOnSubOptions,
    selectedDesignOptionId,
    designOptionSides,
  ]);

  const calculatePrice = async () => {
    if (!options) return;

    const { width, height } = getEffectiveSize();

    // Validate we have valid dimensions
    if (width <= 0 || height <= 0) {
      return;
    }

    // Validate quantity
    if (effectiveQuantity < 25) {
      return;
    }

    setIsCalculatingPrice(true);
    setError(null);

    try {
      // Map selected sides option to pricing value
      const selectedSidesOption = SIDES_OPTIONS.find((opt) => opt.value === selectedSides);
      const pricingSides = selectedSidesOption?.pricingValue || 'double';

      // Build addOns array with sub-options (includes below_upload add-ons only)
      const addOnsPayload = selectedAddOns.map((addOnId) => ({
        addOnId,
        subOptions: addOnSubOptions[addOnId] || {},
      }));

      // Include design option in addOns payload if selected
      if (selectedDesignOptionId) {
        addOnsPayload.push({
          addOnId: selectedDesignOptionId,
          subOptions: {
            sides: designOptionSides, // For custom design pricing
          },
        });
      }

      const response = await fetch('/api/products/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          paperStockId: selectedPaperStockId,
          coatingId: selectedCoatingId,
          turnaroundId: selectedTurnaroundId,
          quantity: effectiveQuantity,
          width,
          height,
          sides: pricingSides,
          addOns: addOnsPayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const result = await response.json();
      const data = result.data || result;
      setPriceBreakdown(data);
    } catch (err) {
      console.error('Price calculation error:', err);
      setError('Unable to calculate price. Please try again.');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // ========================================
  // CALCULATE PRICES FOR ALL TURNAROUNDS
  // ========================================

  useEffect(() => {
    const { width, height } = getEffectiveSize();
    if (
      options?.turnarounds &&
      selectedPaperStockId &&
      selectedCoatingId &&
      (selectedSizeId || (width > 0 && height > 0)) &&
      effectiveQuantity >= 25
    ) {
      calculateAllTurnaroundPrices();
    }
  }, [
    selectedPaperStockId,
    selectedCoatingId,
    selectedSizeId,
    selectedQuantity,
    customQuantity,
    customWidth,
    customHeight,
    selectedSides,
    selectedAddOns,
    addOnSubOptions,
    selectedDesignOptionId,
    designOptionSides,
    options?.turnarounds,
  ]);

  const calculateAllTurnaroundPrices = async () => {
    if (!options) return;

    const { width, height } = getEffectiveSize();

    // Validate dimensions and quantity
    if (width <= 0 || height <= 0 || effectiveQuantity < 25) return;

    setIsCalculatingTurnarounds(true);

    try {
      const selectedSidesOption = SIDES_OPTIONS.find((opt) => opt.value === selectedSides);
      const pricingSides = selectedSidesOption?.pricingValue || 'double';

      const addOnsPayload = selectedAddOns.map((addOnId) => ({
        addOnId,
        subOptions: addOnSubOptions[addOnId] || {},
      }));

      if (selectedDesignOptionId) {
        addOnsPayload.push({
          addOnId: selectedDesignOptionId,
          subOptions: { sides: designOptionSides },
        });
      }

      // Calculate price for each turnaround option
      const prices: Record<number, { total: number; unit: number }> = {};

      await Promise.all(
        options.turnarounds.map(async (turnaround) => {
          try {
            const response = await fetch('/api/products/calculate-price', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId,
                paperStockId: selectedPaperStockId,
                coatingId: selectedCoatingId,
                turnaroundId: turnaround.id,
                quantity: effectiveQuantity,
                width,
                height,
                sides: pricingSides,
                addOns: addOnsPayload,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const data = result.data || result;
              prices[turnaround.id] = {
                total: data.totalPrice,
                unit: data.unitPrice,
              };
            }
          } catch (err) {
            console.error(`Error calculating price for turnaround ${turnaround.id}:`, err);
          }
        })
      );

      setTurnaroundPrices(prices);
    } catch (err) {
      console.error('Error calculating turnaround prices:', err);
    } finally {
      setIsCalculatingTurnarounds(false);
    }
  };

  // ========================================
  // VALIDATION
  // ========================================

  useEffect(() => {
    if (!options) return;

    const errors: string[] = [];

    // Validate Design & Files selection (REQUIRED)
    if (options.addOns?.above_upload && options.addOns.above_upload.length > 0) {
      if (!selectedDesignOptionId) {
        errors.push('Please select a design option');
      } else {
        const selectedDesignOption = options.addOns.above_upload.find(
          (opt) => opt.id === selectedDesignOptionId
        );

        if (selectedDesignOption) {
          // Check if sides selection is required
          if (
            selectedDesignOption.slug === 'standard-custom-design' ||
            selectedDesignOption.slug === 'rush-custom-design'
          ) {
            if (!designOptionSides) {
              errors.push('Please select the number of sides for your custom design');
            }
          }

          // Check if file upload is required
          // Note: "upload-my-artwork" is OPTIONAL - users can upload files later
          // Only design changes require files because they need existing artwork to modify
          const requiresUpload =
            selectedDesignOption.slug === 'design-changes-minor' ||
            selectedDesignOption.slug === 'design-changes-major';

          if (requiresUpload && designOptionFiles.length === 0) {
            errors.push(`Please upload your files for "${selectedDesignOption.name}"`);
          }
        }
      }
    }

    // Validate size requirements
    if (selectedSizeId && options.sizes) {
      const size = options.sizes.find((s) => s.id === selectedSizeId);
      if (size) {
        const selectedAddOnSlugs = options.addOns.below_upload
          .filter((ao) => selectedAddOns.includes(ao.id))
          .map((ao) => ao.slug);

        const sizeValidation = validateSizeRequirements(
          selectedAddOnSlugs,
          size.width,
          size.height
        );

        if (!sizeValidation.isValid) {
          errors.push(...sizeValidation.errors);
        }
      }
    }

    // Validate required sub-options
    for (const addOnId of selectedAddOns) {
      const addOn = options.addOns.below_upload.find((ao) => ao.id === addOnId);
      if (addOn) {
        const validation = validateRequiredSubOptions(addOn, addOnSubOptions[addOnId] || {});
        if (!validation.isValid) {
          errors.push(
            `${addOn.name}: Missing required fields - ${validation.missingFields.join(', ')}`
          );
        }
      }
    }

    setValidationErrors(errors);
  }, [
    selectedAddOns,
    addOnSubOptions,
    selectedSizeId,
    selectedDesignOptionId,
    designOptionSides,
    designOptionFiles,
    options,
  ]);

  // ========================================
  // ADD TO CART
  // ========================================

  const handleAddToCart = async () => {
    if (!priceBreakdown || !options) return;

    // Check for validation errors
    if (validationErrors.length > 0) {
      setError(`Please fix the following issues: ${validationErrors.join('; ')}`);
      return;
    }

    try {
      // Get selected design option addon
      const selectedDesignAddon = options.addOns?.above_upload.find(
        (a) => a.id === selectedDesignOptionId
      );

      // Build addOns payload with sub-options
      const addOnsPayload = selectedAddOns.map((addOnId) => ({
        addOnId,
        subOptions: addOnSubOptions[addOnId] || {},
      }));

      const cartItem = {
        productId,
        productName: options.product.name,
        quantity: selectedQuantity,
        options: {
          paperStockId: selectedPaperStockId,
          coatingId: selectedCoatingId,
          sizeId: selectedSizeId,
          turnaroundId: selectedTurnaroundId,
          sides: selectedSides,
          paperStock: priceBreakdown.paperStock,
          coating: priceBreakdown.coating,
          size: priceBreakdown.size,
          turnaround: priceBreakdown.turnaround,
          // Design option details
          designOptionId: selectedDesignOptionId,
          designOptionSlug: selectedDesignAddon?.slug,
          designOptionName: selectedDesignAddon?.name,
          designOptionSides: designOptionSides, // For custom design
        },
        uploadedFiles: uploadedFileIds, // Include uploaded file IDs
        addOns: addOnsPayload, // Include selected add-ons with sub-options
        price: priceBreakdown.totalPrice,
        unitPrice: priceBreakdown.unitPrice,
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

  // ========================================
  // FORMAT HELPERS
  // ========================================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (isLoadingOptions || !options) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const product = options.product;

  // ========================================
  // RENDER
  // ========================================

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
            {product.category?.name || 'Printing'}
          </Badge>
          <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>
          <p className="text-lg text-muted-foreground">{product.description}</p>
        </div>

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
                <span>Fast turnaround time options available</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Quality guaranteed - 100% satisfaction</span>
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
            <CardDescription>Select your options and quantity below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 1. Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Select
                value={selectedQuantity === 0 ? '0' : selectedQuantity.toString()}
                onValueChange={(value) => {
                  const qty = parseInt(value);
                  setSelectedQuantity(qty);
                  if (qty !== 0) {
                    setCustomQuantity('');
                  }
                }}
              >
                <SelectTrigger id="quantity">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {options.quantities.map((qty) => (
                    <SelectItem key={qty} value={qty.toString()}>
                      {qty.toLocaleString()}
                    </SelectItem>
                  ))}
                  <SelectItem key="custom" value="0">
                    Custom Quantity
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Custom Quantity Input */}
              {selectedQuantity === 0 && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Enter quantity (minimum 25)"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    min={25}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum order: 25 pieces
                  </p>
                </div>
              )}
            </div>

            {/* 2. Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={selectedSizeId === 0 ? '0' : (selectedSizeId?.toString() || '')}
                onValueChange={(value) => {
                  const sizeId = parseInt(value);
                  setSelectedSizeId(sizeId);
                  if (sizeId !== 0) {
                    setCustomWidth('');
                    setCustomHeight('');
                  }
                }}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {options.sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id.toString()}>
                      {size.name}
                    </SelectItem>
                  ))}
                  <SelectItem key="custom" value="0">
                    Custom Size
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Custom Size Inputs */}
              {selectedSizeId === 0 && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="custom-width" className="text-xs">Width (inches)</Label>
                      <Input
                        id="custom-width"
                        type="number"
                        placeholder="e.g., 4"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        min={1}
                        max={28}
                        step={0.125}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-height" className="text-xs">Height (inches)</Label>
                      <Input
                        id="custom-height"
                        type="number"
                        placeholder="e.g., 6"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        min={1}
                        max={40}
                        step={0.125}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max size: 28" × 40" | Standard bleed: 0.125" on all sides
                  </p>
                </div>
              )}
            </div>

            {/* 3. Paper Stock */}
            <div className="space-y-2">
              <Label htmlFor="paperStock">Paper Stock</Label>
              <Select
                value={selectedPaperStockId?.toString() || ''}
                onValueChange={(value) => {
                  const newPaperStockId = parseInt(value);
                  setSelectedPaperStockId(newPaperStockId);

                  // Set coating based on paper stock type
                  const paperStock = options.paperStocks.find((ps) => ps.id === newPaperStockId);

                  // For 12pt, 14pt, 16pt C2S Cardstock, default to UV Both Sides (coating ID 5)
                  const uvBothSidesCardstocks = [2, 5, 7]; // 16pt, 12pt, 14pt
                  const uvBothSidesCoating = paperStock?.coatings.find((c) => c.id === 5);

                  if (uvBothSidesCardstocks.includes(newPaperStockId) && uvBothSidesCoating) {
                    setSelectedCoatingId(5); // High Gloss UV Both Sides
                  } else {
                    // For other paper stocks, use first available coating
                    setSelectedCoatingId(paperStock?.coatings[0]?.id || null);
                  }
                }}
              >
                <SelectTrigger id="paperStock">
                  <SelectValue placeholder="Select paper stock" />
                </SelectTrigger>
                <SelectContent>
                  {options.paperStocks.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id.toString()}>
                      {ps.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaperStockId && (
                <p className="text-sm text-muted-foreground">
                  {options.paperStocks.find((ps) => ps.id === selectedPaperStockId)?.description}
                </p>
              )}
            </div>

            {/* 4. Coating (Filtered by Paper Stock) */}
            <div className="space-y-2">
              <Label htmlFor="coating">Coating</Label>
              <Select
                value={selectedCoatingId?.toString() || ''}
                onValueChange={(value) => setSelectedCoatingId(parseInt(value))}
                disabled={availableCoatings.length === 0}
              >
                <SelectTrigger id="coating">
                  <SelectValue placeholder="Select coating" />
                </SelectTrigger>
                <SelectContent>
                  {availableCoatings.map((coating) => (
                    <SelectItem key={coating.id} value={coating.id.toString()}>
                      {coating.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCoatingId && (
                <p className="text-sm text-muted-foreground">
                  {availableCoatings.find((c) => c.id === selectedCoatingId)?.description}
                </p>
              )}
            </div>

            {/* 5. Sides (Single/Double) */}
            <div className="space-y-3">
              <Label>Printing Sides</Label>
              <Select value={selectedSides} onValueChange={setSelectedSides}>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select printing sides" />
                </SelectTrigger>
                <SelectContent>
                  {SIDES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-3">
                      <span className="font-medium">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Mandatory Options (Top - No Label) - HIDDEN - Will be rebuilt */}
            {/* {options.addOns && (() => {
              const allAddOns = [...(options.addOns.above_upload || []), ...(options.addOns.below_upload || [])];
              const mandatoryAddOns = allAddOns.filter(a => a.is_mandatory);

              if (mandatoryAddOns.length === 0) return null;

              return (
                <div className="space-y-3">
                  {mandatoryAddOns.map((addOn) => (
                    <AddOnWithSubOptions
                      key={addOn.id}
                      addOn={addOn}
                      isSelected={selectedAddOns.includes(addOn.id)}
                      onToggle={(selected) => {
                        // Mandatory options should always be selected
                        if (selected && !selectedAddOns.includes(addOn.id)) {
                          setSelectedAddOns([...selectedAddOns, addOn.id]);
                        }
                      }}
                      subOptionValues={addOnSubOptions[addOn.id] || {}}
                      onSubOptionChange={(fieldName, value) => {
                        setAddOnSubOptions({
                          ...addOnSubOptions,
                          [addOn.id]: {
                            ...(addOnSubOptions[addOn.id] || {}),
                            [fieldName]: value,
                          },
                        });
                      }}
                      quantity={selectedQuantity}
                    />
                  ))}
                </div>
              );
            })()} */}

            {/* 7. Additional Options - Simple Flat List */}
            {options.addOns?.below_upload && options.addOns.below_upload.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Additional Options</Label>
                {options.addOns.below_upload
                  .filter((a) => !a.is_mandatory)
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((addOn) => (
                    <AddOnWithSubOptions
                      key={addOn.id}
                      addOn={addOn}
                      isSelected={selectedAddOns.includes(addOn.id)}
                      onToggle={(selected) => {
                        if (selected) {
                          // Check for conflicts
                          const selectedSlugs = options.addOns.below_upload
                            .filter((a) => selectedAddOns.includes(a.id))
                            .map((a) => a.slug);

                          const conflict = checkAddOnConflicts(addOn.slug, selectedSlugs);
                          if (conflict.hasConflict) {
                            setError(
                              conflict.reason || 'This addon conflicts with another selection'
                            );
                            return;
                          }

                          // Add the addon
                          let newSelectedAddOns = [...selectedAddOns, addOn.id];

                          // Check if this addon requires other addons
                          const requiredAddOnIds = getRequiredAddOns(
                            [...selectedSlugs, addOn.slug],
                            options.addOns.below_upload
                          );

                          // Auto-enable required addons
                          newSelectedAddOns = [...newSelectedAddOns, ...requiredAddOnIds];

                          setSelectedAddOns(newSelectedAddOns);
                        } else {
                          setSelectedAddOns(selectedAddOns.filter((id) => id !== addOn.id));
                          const newSubOptions = { ...addOnSubOptions };
                          delete newSubOptions[addOn.id];
                          setAddOnSubOptions(newSubOptions);
                        }
                      }}
                      subOptionValues={addOnSubOptions[addOn.id] || {}}
                      onSubOptionChange={(fieldName, value) => {
                        setAddOnSubOptions({
                          ...addOnSubOptions,
                          [addOn.id]: {
                            ...(addOnSubOptions[addOn.id] || {}),
                            [fieldName]: value,
                          },
                        });
                      }}
                      quantity={selectedQuantity}
                    />
                  ))}
              </div>
            )}

            {/* 8. Design & Files (Above Turnaround Time) */}
            {options.addOns?.above_upload && options.addOns.above_upload.length > 0 && (
              <DesignOptionSelector
                designOptions={options.addOns.above_upload as any}
                selectedOptionId={selectedDesignOptionId}
                onOptionChange={(optionId) => {
                  // Only reset dependent states when ACTUALLY changing to a different option
                  if (optionId !== selectedDesignOptionId) {
                    setSelectedDesignOptionId(optionId);
                    setDesignOptionSides('');
                    setDesignOptionFiles([]);
                  }
                }}
                selectedSides={designOptionSides}
                onSidesChange={setDesignOptionSides}
                uploadedFiles={designOptionFiles}
                onFilesChange={async (files) => {
                  setDesignOptionFiles(files);

                  // Upload files to backend (optional - files tracked locally for validation)
                  const uploadedIds: number[] = [];
                  for (const file of files) {
                    try {
                      const formData = new FormData();
                      formData.append('file', file);

                      const response = await fetch('/api/files/upload', {
                        method: 'POST',
                        body: formData,
                      });

                      if (response.ok) {
                        const result = await response.json();
                        // Handle both response formats: result.id or result.data?.id
                        const fileId = result.id || result.data?.id;
                        if (fileId) {
                          uploadedIds.push(fileId);
                        }
                      }
                    } catch (error) {
                      // Upload failed but files are still tracked locally
                      console.error('File upload error:', error);
                    }
                  }
                  setUploadedFileIds(uploadedIds);
                }}
                maxFiles={10}
              />
            )}

            {/* 9. Turnaround Time */}
            <div className="space-y-3">
              <Label>Turnaround Time</Label>
              {isCalculatingTurnarounds && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating prices...
                </div>
              )}
              <RadioGroup
                value={selectedTurnaroundId?.toString()}
                onValueChange={(value) => setSelectedTurnaroundId(parseInt(value))}
              >
                {options.turnarounds.map((turnaround) => {
                  // Get pre-calculated price for this turnaround
                  const turnaroundPriceData = turnaroundPrices[turnaround.id];
                  const totalPrice = turnaroundPriceData?.total || 0;
                  const unitPrice = turnaroundPriceData?.unit || 0;

                  // Find lowest price for "Best Value" badge
                  const allPrices = Object.values(turnaroundPrices).map((p) => p.total);
                  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                  const isLowestPrice = totalPrice > 0 && totalPrice === lowestPrice;

                  // Check if this is the selected option
                  const isSelected = selectedTurnaroundId === turnaround.id;

                  return (
                    <div
                      key={turnaround.id}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors',
                        isSelected && 'border-primary bg-primary/5',
                        isLowestPrice && 'border-green-500/50'
                      )}
                    >
                      <RadioGroupItem
                        value={turnaround.id.toString()}
                        id={`turnaround-${turnaround.id}`}
                      />
                      <label
                        htmlFor={`turnaround-${turnaround.id}`}
                        className="flex flex-1 cursor-pointer items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{turnaround.name}</span>
                            {isLowestPrice && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-500">
                                Best Value
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {turnaround.description ||
                              `${turnaround.production_days} business day${turnaround.production_days !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                        {turnaroundPriceData ? (
                          <div className="text-right">
                            <div className={cn('font-bold', isLowestPrice && 'text-green-600')}>
                              {formatPrice(totalPrice)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({formatPrice(unitPrice)} ea)
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">—</div>
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* 9. Price Summary - Enhanced M13Print-style breakdown */}
            <div className="space-y-3">
              <Label>Price Calculator</Label>
              <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                {priceBreakdown ? (
                  <>
                    {/* Configuration Summary */}
                    <div className="space-y-1 text-sm border-b pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{priceBreakdown.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{priceBreakdown.quantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paper:</span>
                        <span className="font-medium">{priceBreakdown.paperStock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coating:</span>
                        <span className="font-medium">{priceBreakdown.coating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sides:</span>
                        <span className="font-medium">
                          {SIDES_OPTIONS.find((opt) => opt.value === selectedSides)?.label || 'Both Sides'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Turnaround:</span>
                        <span className="font-medium">{priceBreakdown.turnaround}</span>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-1 text-sm border-b pb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Cost:</span>
                        <span>{formatPrice(priceBreakdown.baseCost)}</span>
                      </div>
                      {priceBreakdown.markupAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Markup:</span>
                          <span>+{formatPrice(priceBreakdown.markupAmount)}</span>
                        </div>
                      )}
                      {priceBreakdown.subtotal && priceBreakdown.subtotal !== priceBreakdown.baseCost && (
                        <div className="flex justify-between font-medium border-t pt-1 mt-1">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>{formatPrice(priceBreakdown.subtotal)}</span>
                        </div>
                      )}
                      {priceBreakdown.addOnsCost && priceBreakdown.addOnsCost > 0 && (
                        <>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Add-ons:</span>
                            <span>+{formatPrice(priceBreakdown.addOnsCost)}</span>
                          </div>
                          {priceBreakdown.addOnsDetails?.map((addon, idx) => (
                            <div key={idx} className="flex justify-between text-xs pl-2 text-muted-foreground">
                              <span>• {addon.name}</span>
                              <span>+{formatPrice(addon.cost)}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {priceBreakdown.discountAmount && priceBreakdown.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatPrice(priceBreakdown.discountAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          {isCalculatingPrice ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            formatPrice(priceBreakdown.totalPrice)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Price per piece:</span>
                        <span className="font-medium">{formatPrice(priceBreakdown.unitPrice)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Validation Warnings */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-semibold mb-1">Please fix the following issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-sm">
                        {err}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={isCalculatingPrice || !priceBreakdown}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>

        {/* Template Download Section - Separate from Configure Your Order */}
        {selectedSizeId && selectedSizeId > 0 && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium">Download Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Use our template to ensure your artwork is print-ready
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Specifications:</strong></p>
                    <ul className="list-disc list-inside space-y-0.5 pl-2">
                      <li>Resolution: 300dpi</li>
                      <li>Bleed: 1/8" (0.125")</li>
                      <li>Color Mode: CMYK</li>
                      <li>File Format: PDF, AI, PSD, JPG</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const selectedSize = options?.sizes.find(s => s.id === selectedSizeId);
                      if (selectedSize) {
                        const templateInfo = `UV Coated Club Flyers - Template Specifications

Size: ${selectedSize.name} (${selectedSize.width}" x ${selectedSize.height}")

Document Setup:
- Width: ${selectedSize.width + 0.25}" (includes 0.125" bleed on each side)
- Height: ${selectedSize.height + 0.25}" (includes 0.125" bleed on each side)
- Resolution: 300 DPI
- Color Mode: CMYK
- Bleed: 0.125" on all sides
- Safety Margin: 0.125" from trim line

File Formats Accepted:
- PDF (preferred)
- Adobe Illustrator (.ai)
- Adobe Photoshop (.psd)
- High-resolution JPG (300dpi minimum)

Tips:
- Extend background images/colors to the bleed line
- Keep important text/logos within the safety margin
- Convert all fonts to outlines
- Embed all linked images
`;
                        const blob = new Blob([templateInfo], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `template-${selectedSize.width}x${selectedSize.height}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
