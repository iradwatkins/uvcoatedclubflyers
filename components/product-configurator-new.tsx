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
import { ShoppingCart, Check, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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

  useEffect(() => {
    if (
      selectedPaperStockId &&
      selectedCoatingId &&
      selectedSizeId &&
      selectedTurnaroundId &&
      selectedQuantity
    ) {
      calculatePrice();
    }
  }, [
    selectedPaperStockId,
    selectedCoatingId,
    selectedSizeId,
    selectedTurnaroundId,
    selectedQuantity,
    selectedSides,
    selectedAddOns,
    addOnSubOptions,
    selectedDesignOptionId,
    designOptionSides,
  ]);

  const calculatePrice = async () => {
    if (!options || !selectedSizeId) return;

    setIsCalculatingPrice(true);
    setError(null);

    try {
      const size = options.sizes.find((s) => s.id === selectedSizeId);
      if (!size) {
        throw new Error('Selected size not found');
      }

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
          quantity: selectedQuantity,
          width: size.width,
          height: size.height,
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
          const requiresUpload =
            selectedDesignOption.slug === 'upload-my-artwork' ||
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
        price: Math.round(priceBreakdown.totalPrice * 100), // Convert to cents
        unitPrice: Math.round(priceBreakdown.unitPrice * 100), // Convert to cents
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
            {/* 1. Quantity - MOVED TO FIRST */}
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
            </div>

            {/* 2. Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={selectedSizeId?.toString() || ''}
                onValueChange={(value) => setSelectedSizeId(parseInt(value))}
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
                designOptions={options.addOns.above_upload}
                selectedOptionId={selectedDesignOptionId}
                onOptionChange={(optionId) => {
                  setSelectedDesignOptionId(optionId);
                  // Reset dependent states when changing design option
                  setDesignOptionSides('');
                  setDesignOptionFiles([]);
                }}
                selectedSides={designOptionSides}
                onSidesChange={setDesignOptionSides}
                uploadedFiles={designOptionFiles}
                onFilesChange={async (files) => {
                  setDesignOptionFiles(files);

                  // Upload files to backend
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
                        if (result.data?.id) {
                          uploadedIds.push(result.data.id);
                        }
                      }
                    } catch (error) {
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
              <RadioGroup
                value={selectedTurnaroundId?.toString()}
                onValueChange={(value) => setSelectedTurnaroundId(parseInt(value))}
              >
                {options.turnarounds.map((turnaround) => {
                  // Calculate price for this turnaround if we have a breakdown
                  const turnaroundPrice = priceBreakdown?.totalPrice || 0;
                  const unitPrice = priceBreakdown?.unitPrice || 0;

                  return (
                    <div
                      key={turnaround.id}
                      className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
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
                          <span className="font-medium text-sm">{turnaround.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {turnaround.description ||
                              `${turnaround.production_days} business days`}
                          </span>
                        </div>
                        {priceBreakdown && (
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(turnaroundPrice)}</div>
                            <div className="text-xs text-muted-foreground">
                              ({formatPrice(unitPrice)} ea)
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* 9. Price Summary */}
            <div className="space-y-3">
              <Label>Price Summary</Label>
              <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                {priceBreakdown ? (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-3xl font-bold text-primary">
                      {isCalculatingPrice ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        formatPrice(priceBreakdown.totalPrice)
                      )}
                    </span>
                  </div>
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
      </div>
    </div>
  );
}
