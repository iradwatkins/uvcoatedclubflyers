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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/image-upload';
import { ProductOptionsTab } from '@/components/admin/products/product-options-tab';

interface Product {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number | null;
  quantities?: string | null;
  sizes?: string | null;
  availablePaperStocks?: number[] | null;
  availableTurnarounds?: number[] | null;
  mandatoryAddons?: any[] | null;
  availableAddons?: number[] | null;
}

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

interface ProductEditFormProps {
  product: Product;
  categories: Category[];
  paperStocks: PaperStock[];
  turnarounds: Turnaround[];
}

export function ProductEditForm({
  product,
  categories,
  paperStocks,
  turnarounds,
}: ProductEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product details state
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    basePrice: (product.basePrice / 100).toFixed(2),
    sku: product.sku || '',
    imageUrl: product.imageUrl || '',
    imageUrl2: (product as any).imageUrl2 || '',
    imageUrl3: (product as any).imageUrl3 || '',
    imageUrl4: (product as any).imageUrl4 || '',
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId?.toString() || '',
  });

  // Product configuration state
  const [quantities, setQuantities] = useState(
    product.quantities || '25,50,100,250,500,1000,2500,5000'
  );
  const [sizes, setSizes] = useState(product.sizes || '4x6,5x7,6x9,8.5x11');
  const [selectedPaperStocks, setSelectedPaperStocks] = useState<number[]>(
    product.availablePaperStocks || []
  );
  const [selectedTurnarounds, setSelectedTurnarounds] = useState<number[]>(
    product.availableTurnarounds || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: Math.round(parseFloat(formData.basePrice) * 100),
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          quantities,
          sizes,
          availablePaperStocks: selectedPaperStocks,
          availableTurnarounds: selectedTurnarounds,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product updated successfully' });
        router.refresh();
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating the product' });
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? 'Saving...' : 'Save Changes'}
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
          <TabsTrigger value="options">Add-ons</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the core product details</CardDescription>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
                      <SelectItem value="none">No Category</SelectItem>
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
                  {paperStocks.map((stock) => (
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
                  ))}
                </div>
              </div>

              {/* Turnaround Times */}
              <div className="space-y-2">
                <Label>
                  Turnaround Times
                  <span className="text-sm text-muted-foreground ml-2">
                    (Select exactly 4 options to show as checkboxes)
                  </span>
                </Label>
                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                  {turnarounds.map((turnaround) => (
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
                  ))}
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
          <ProductOptionsTab productId={product.id} />
        </TabsContent>
      </Tabs>
    </form>
  );
}
