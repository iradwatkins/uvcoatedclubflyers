'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/image-upload';

interface Category {
  id: number;
  name: string;
}

interface PaperStock {
  id: number;
  name: string;
  display_order: number;
}

interface Turnaround {
  id: number;
  name: string;
  production_days: number;
  display_order: number;
}

interface ProductCreateFormProps {
  categories: Category[];
  paperStocks: PaperStock[];
  turnarounds: Turnaround[];
}

interface ProductOption {
  option_type: string;
  option_name: string;
  option_value: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

export function ProductCreateForm({ categories, paperStocks, turnarounds }: ProductCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product details state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    sku: '',
    imageUrl: '',
    imageUrl2: '',
    imageUrl3: '',
    imageUrl4: '',
    isActive: true,
    isFeatured: false,
    categoryId: '',
  });

  // Product options state
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // Product configuration state
  const [quantities, setQuantities] = useState('25,50,100,250,500,1000,2500,5000');
  const [sizes, setSizes] = useState('4x6,5x7,6x9,8.5x11');
  const [selectedPaperStocks, setSelectedPaperStocks] = useState<number[]>([]);
  const [selectedTurnarounds, setSelectedTurnarounds] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: Math.round(parseFloat(formData.basePrice) * 100),
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          options: productOptions,
          quantities,
          sizes,
          availablePaperStocks: selectedPaperStocks,
          availableTurnarounds: selectedTurnarounds,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product created successfully' });
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to create product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while creating the product' });
    } finally {
      setLoading(false);
    }
  };

  const addOption = (optionType: string) => {
    const newOption: ProductOption = {
      option_type: optionType,
      option_name: '',
      option_value: '',
      price_modifier: 0,
      is_default: false,
      sort_order: productOptions.filter((o) => o.option_type === optionType).length,
    };
    setProductOptions([...productOptions, newOption]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...productOptions];
    updated[index] = { ...updated[index], [field]: value };
    setProductOptions(updated);
  };

  const removeOption = (index: number) => {
    setProductOptions(productOptions.filter((_, i) => i !== index));
  };

  const optionTypes = ['size', 'material', 'coating', 'sides'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/products">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="configuration">Product Configuration</TabsTrigger>
          <TabsTrigger value="options">Product Options</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the core product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., UV Coated Flyer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., FLY-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your product..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (USD) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Images */}
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold">Product Images</h3>
                <p className="text-sm text-muted-foreground">
                  Upload 1 main image (required) and up to 3 additional images (optional)
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                  <ImageUpload
                    currentImageUrl={formData.imageUrl || undefined}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                    onImageRemoved={() => setFormData({ ...formData, imageUrl: '' })}
                    label="Main Product Image *"
                  />

                  <ImageUpload
                    currentImageUrl={formData.imageUrl2 || undefined}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl2: url })}
                    onImageRemoved={() => setFormData({ ...formData, imageUrl2: '' })}
                    label="Additional Image 2"
                  />

                  <ImageUpload
                    currentImageUrl={formData.imageUrl3 || undefined}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl3: url })}
                    onImageRemoved={() => setFormData({ ...formData, imageUrl3: '' })}
                    label="Additional Image 3"
                  />

                  <ImageUpload
                    currentImageUrl={formData.imageUrl4 || undefined}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl4: url })}
                    onImageRemoved={() => setFormData({ ...formData, imageUrl4: '' })}
                    label="Additional Image 4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active (visible to customers)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="isFeatured" className="cursor-pointer">
                    Featured Product
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Configurator Settings</CardTitle>
              <CardDescription>
                Configure what options customers can select when ordering this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quantities */}
              <div className="space-y-2">
                <Label htmlFor="quantities">
                  Available Quantities *
                  <span className="text-sm text-muted-foreground ml-2">
                    (Comma-separated, e.g., "25,50,100,250,500,1000,2500,5000")
                  </span>
                </Label>
                <Input
                  id="quantities"
                  value={quantities}
                  onChange={(e) => setQuantities(e.target.value)}
                  placeholder="25,50,100,250,500,1000,2500,5000"
                  required
                />
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <Label htmlFor="sizes">
                  Available Sizes *
                  <span className="text-sm text-muted-foreground ml-2">
                    (Comma-separated, e.g., "4x6,5x7,6x9,8.5x11")
                  </span>
                </Label>
                <Input
                  id="sizes"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  placeholder="4x6,5x7,6x9,8.5x11"
                  required
                />
              </div>

              {/* Paper Stocks */}
              <div className="space-y-2">
                <Label>Available Paper Stocks</Label>
                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                  {paperStocks.length > 0 ? (
                    paperStocks.map((stock) => (
                      <div key={stock.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`paper-stock-${stock.id}`}
                          checked={selectedPaperStocks.includes(stock.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPaperStocks([...selectedPaperStocks, stock.id]);
                            } else {
                              setSelectedPaperStocks(
                                selectedPaperStocks.filter((id) => id !== stock.id)
                              );
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`paper-stock-${stock.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {stock.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-2">
                      No paper stocks configured. Add paper stocks in the system settings.
                    </p>
                  )}
                </div>
              </div>

              {/* Turnaround Times */}
              <div className="space-y-2">
                <Label>
                  Turnaround Times
                  <span className="text-sm text-muted-foreground ml-2">
                    (Select up to 4 options to show as checkboxes)
                  </span>
                </Label>
                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                  {turnarounds.length > 0 ? (
                    turnarounds.map((turnaround) => (
                      <div key={turnaround.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`turnaround-${turnaround.id}`}
                          checked={selectedTurnarounds.includes(turnaround.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedTurnarounds.length < 4) {
                                setSelectedTurnarounds([...selectedTurnarounds, turnaround.id]);
                              }
                            } else {
                              setSelectedTurnarounds(
                                selectedTurnarounds.filter((id) => id !== turnaround.id)
                              );
                            }
                          }}
                          className="h-4 w-4"
                          disabled={
                            !selectedTurnarounds.includes(turnaround.id) &&
                            selectedTurnarounds.length >= 4
                          }
                        />
                        <Label
                          htmlFor={`turnaround-${turnaround.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {turnaround.name} ({turnaround.production_days} days)
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-2">
                      No turnaround times configured. Add turnarounds in the system settings.
                    </p>
                  )}
                </div>
                {selectedTurnarounds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedTurnarounds.length}/4
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-6">
          {optionTypes.map((type) => {
            const typeOptions = productOptions.filter((o) => o.option_type === type);

            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">{type} Options</CardTitle>
                      <CardDescription>
                        Configure available {type} options and pricing
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(type)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add {type}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typeOptions.map((option, idx) => {
                      const globalIndex = productOptions.indexOf(option);
                      return (
                        <div
                          key={globalIndex}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1 grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                value={option.option_name}
                                onChange={(e) =>
                                  updateOption(globalIndex, 'option_name', e.target.value)
                                }
                                placeholder="e.g., 4x6"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Value</Label>
                              <Input
                                value={option.option_value}
                                onChange={(e) =>
                                  updateOption(globalIndex, 'option_value', e.target.value)
                                }
                                placeholder="e.g., 4x6"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price Modifier ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={(option.price_modifier / 100).toFixed(2)}
                                onChange={(e) =>
                                  updateOption(
                                    globalIndex,
                                    'price_modifier',
                                    Math.round(parseFloat(e.target.value || '0') * 100)
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={option.is_default}
                                  onCheckedChange={(checked) =>
                                    updateOption(globalIndex, 'is_default', checked)
                                  }
                                />
                                <Label className="text-sm">Default</Label>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeOption(globalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {typeOptions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No {type} options configured. Click "Add {type}" to create one.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </form>
  );
}
