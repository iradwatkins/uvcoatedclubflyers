'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, ExternalLink, List } from 'lucide-react';
import { AddonPricingFields } from './addon-pricing-fields';
import { AddonSubOptionEditor, SubOption } from './addon-sub-option-editor';
import { ChoiceForm } from './choice-form';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Choice {
  id: number;
  add_on_id: number;
  value: string;
  label: string;
  description: string | null;
  price_type: string;
  base_price: string | null;
  per_unit_price: string | null;
  sides_pricing: any;
  is_default: boolean;
  display_order: number;
  requires_file_upload: boolean;
  requires_sides_selection: boolean;
}

interface AddonFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    tooltipText: string | null;
    pricingModel: string;
    basePrice: string | null;
    perUnitPrice: string | null;
    percentage: string | null;
    uiComponent: string;
    position: string;
    displayOrder: number;
    isMandatoryDefault: boolean;
    isEnabledDefault: boolean;
    turnaroundDaysAdd: number;
    isActive: boolean;
    adminNotes: string | null;
  };
  initialSubOptions?: any[];
  initialChoices?: Choice[];
}

export function AddonForm({ mode, initialData, initialSubOptions = [], initialChoices = [] }: AddonFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tooltipText, setTooltipText] = useState(initialData?.tooltipText || '');
  const [pricingModel, setPricingModel] = useState(initialData?.pricingModel || '');
  const [basePrice, setBasePrice] = useState<number | ''>(
    initialData?.basePrice ? parseFloat(initialData.basePrice) : ''
  );
  const [perUnitPrice, setPerUnitPrice] = useState<number | ''>(
    initialData?.perUnitPrice ? parseFloat(initialData.perUnitPrice) : ''
  );
  const [percentage, setPercentage] = useState<number | ''>(
    initialData?.percentage ? parseFloat(initialData.percentage) : ''
  );
  const [uiComponent, setUiComponent] = useState(initialData?.uiComponent || 'checkbox');
  const [position, setPosition] = useState(initialData?.position || 'below_upload');
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder || 0);
  const [isMandatoryDefault, setIsMandatoryDefault] = useState(
    initialData?.isMandatoryDefault || false
  );
  const [isEnabledDefault, setIsEnabledDefault] = useState(initialData?.isEnabledDefault || false);
  const [turnaroundDaysAdd, setTurnaroundDaysAdd] = useState(initialData?.turnaroundDaysAdd || 0);
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);
  const [adminNotes, setAdminNotes] = useState(initialData?.adminNotes || '');

  // Sub-options state
  const [subOptions, setSubOptions] = useState<SubOption[]>(() => {
    return initialSubOptions.map((opt, index) => ({
      fieldName: opt.field_name || opt.fieldName || '',
      fieldLabel: opt.field_label || opt.fieldLabel || '',
      fieldType: opt.field_type || opt.fieldType || 'text',
      options: typeof opt.options === 'string' ? opt.options : JSON.stringify(opt.options || []),
      defaultValue: opt.default_value || opt.defaultValue || '',
      isRequired: opt.is_required || opt.isRequired || false,
      minValue: opt.min_value || opt.minValue,
      maxValue: opt.max_value || opt.maxValue,
      pattern: opt.pattern || '',
      displayOrder: opt.display_order || opt.displayOrder || index,
    }));
  });

  // Choices state for dynamic updates
  const [choices, setChoices] = useState<Choice[]>(initialChoices);

  // Refresh choices after adding a new one
  const refreshChoices = async () => {
    if (initialData?.id) {
      try {
        const res = await fetch(`/api/addons/${initialData.id}/choices`);
        const data = await res.json();
        if (data.choices) {
          setChoices(data.choices);
        }
      } catch (err) {
        console.error('Failed to refresh choices:', err);
      }
    }
  };

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!pricingModel) {
      newErrors.pricingModel = 'Pricing model is required';
    }

    // Pricing validation
    if (pricingModel === 'FLAT' && !basePrice && basePrice !== 0) {
      newErrors.basePrice = 'Base price is required for FLAT pricing';
    }
    if (pricingModel === 'PER_UNIT' && !perUnitPrice) {
      newErrors.perUnitPrice = 'Per unit price is required for PER_UNIT pricing';
    }
    if (pricingModel === 'PERCENTAGE' && percentage === '') {
      newErrors.percentage = 'Percentage is required for PERCENTAGE pricing';
    }
    if (pricingModel === 'CUSTOM' && !basePrice && basePrice !== 0 && !perUnitPrice) {
      newErrors.pricing = 'At least one price field is required for CUSTOM pricing';
    }

    if (!uiComponent) {
      newErrors.uiComponent = 'UI component is required';
    }

    if (!position) {
      newErrors.position = 'Position is required';
    }

    // Sub-option validation
    for (let i = 0; i < subOptions.length; i++) {
      const opt = subOptions[i];
      if (!opt.fieldName.trim()) {
        newErrors[`subOption${i}_fieldName`] = `Sub-option #${i + 1}: Field name is required`;
      }
      if (!opt.fieldLabel.trim()) {
        newErrors[`subOption${i}_fieldLabel`] = `Sub-option #${i + 1}: Field label is required`;
      }
      if (!opt.fieldType) {
        newErrors[`subOption${i}_fieldType`] = `Sub-option #${i + 1}: Field type is required`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setError('Please fix the validation errors');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare sub-options payload
      const subOptionsPayload = subOptions.map((opt) => ({
        fieldName: opt.fieldName,
        fieldLabel: opt.fieldLabel,
        fieldType: opt.fieldType,
        options: opt.options ? JSON.parse(opt.options) : null,
        defaultValue: opt.defaultValue || null,
        isRequired: opt.isRequired,
        minValue: opt.minValue || null,
        maxValue: opt.maxValue || null,
        pattern: opt.pattern || null,
        displayOrder: opt.displayOrder,
      }));

      const payload = {
        name,
        description: description || null,
        tooltipText: tooltipText || null,
        pricingModel,
        basePrice: basePrice || null,
        perUnitPrice: perUnitPrice || null,
        percentage: percentage || null,
        uiComponent,
        position,
        displayOrder,
        isMandatoryDefault,
        isEnabledDefault,
        turnaroundDaysAdd,
        isActive,
        adminNotes: adminNotes || null,
        subOptions: subOptionsPayload,
      };

      const url = mode === 'create' ? '/api/addons' : `/api/addons/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} addon`);
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/admin/addons');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Save addon error:', err);
      setError(err.message || `Failed to ${mode} addon`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Create Add-On' : 'Edit Add-On'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Configure a new addon for products'
              : `Editing: ${initialData?.name}`}
          </p>
        </div>
        <Link href="/admin/addons">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Add-Ons
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <AlertDescription className="text-green-700 dark:text-green-300">
            Add-on {mode === 'create' ? 'created' : 'updated'} successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General details about the addon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Shrink Wrapping"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Customer-facing description of this addon"
              rows={3}
            />
          </div>

          {/* Tooltip Text */}
          <div className="space-y-2">
            <Label htmlFor="tooltipText">Tooltip Text</Label>
            <Textarea
              id="tooltipText"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              placeholder="Additional help text shown in tooltip (optional)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>How this addon affects order pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pricing Model */}
          <div className="space-y-2">
            <Label htmlFor="pricingModel">
              Pricing Model <span className="text-red-500">*</span>
            </Label>
            <Select value={pricingModel} onValueChange={setPricingModel}>
              <SelectTrigger
                id="pricingModel"
                className={errors.pricingModel ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Select pricing model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLAT">Flat Price (e.g., $5.00 for Digital Proof)</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage (e.g., +20% for Spot UV)</SelectItem>
                <SelectItem value="PER_UNIT">Per Unit (e.g., $0.10/piece for Numbering)</SelectItem>
                <SelectItem value="CUSTOM">
                  Custom Formula (e.g., $20 + $0.01/piece for Perforation)
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.pricingModel && <p className="text-sm text-red-500">{errors.pricingModel}</p>}
          </div>

          {/* Dynamic Pricing Fields */}
          <AddonPricingFields
            pricingModel={pricingModel}
            basePrice={basePrice}
            perUnitPrice={perUnitPrice}
            percentage={percentage}
            onBasePriceChange={setBasePrice}
            onPerUnitPriceChange={setPerUnitPrice}
            onPercentageChange={setPercentage}
            errors={errors}
          />
        </CardContent>
      </Card>

      {/* Display Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Display Configuration</CardTitle>
          <CardDescription>How this addon appears to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* UI Component */}
          <div className="space-y-2">
            <Label htmlFor="uiComponent">
              UI Component <span className="text-red-500">*</span>
            </Label>
            <Select value={uiComponent} onValueChange={setUiComponent}>
              <SelectTrigger id="uiComponent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="dropdown">Dropdown (Select)</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">
              Position <span className="text-red-500">*</span>
            </Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above_upload">Above Upload (Design Options)</SelectItem>
                <SelectItem value="below_upload">Below Upload (Additional Options)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
          </div>
        </CardContent>
      </Card>

      {/* Choices Section - Only for dropdown add-ons in edit mode */}
      {mode === 'edit' && uiComponent === 'dropdown' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Dropdown Choices
                  {choices.length > 0 && (
                    <Badge variant="secondary">{choices.length} choices</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Options that customers can select from the dropdown
                </CardDescription>
              </div>
              <Link href={`/admin/addons/${initialData?.id}/choices`}>
                <Button type="button" variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Choices
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {choices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left text-sm font-medium text-muted-foreground">Order</th>
                      <th className="pb-2 text-left text-sm font-medium text-muted-foreground">Label</th>
                      <th className="pb-2 text-left text-sm font-medium text-muted-foreground">Value</th>
                      <th className="pb-2 text-left text-sm font-medium text-muted-foreground">Pricing</th>
                      <th className="pb-2 text-center text-sm font-medium text-muted-foreground">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {choices.map((choice) => {
                      // Format pricing display
                      let pricingDisplay = 'FREE';
                      const basePrice = parseFloat(choice.base_price || '0');
                      const perUnit = parseFloat(choice.per_unit_price || '0');

                      if ((choice.price_type === 'sides_based' || choice.price_type === 'custom') && choice.sides_pricing) {
                        const sp = typeof choice.sides_pricing === 'string'
                          ? JSON.parse(choice.sides_pricing)
                          : choice.sides_pricing;
                        if (sp.one && sp.two) {
                          pricingDisplay = `$${parseFloat(sp.one).toFixed(0)}-$${parseFloat(sp.two).toFixed(0)}`;
                        }
                      } else if (choice.price_type === 'flat' && basePrice > 0) {
                        pricingDisplay = `$${basePrice.toFixed(2)}`;
                      } else if (choice.price_type === 'per_unit' && perUnit > 0) {
                        pricingDisplay = `$${perUnit.toFixed(4)}/unit`;
                      }

                      return (
                        <tr key={choice.id} className="border-b last:border-0">
                          <td className="py-2 text-sm text-muted-foreground">{choice.display_order}</td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{choice.label}</span>
                              {choice.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            {choice.description && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                {choice.description}
                              </p>
                            )}
                          </td>
                          <td className="py-2 text-sm font-mono text-muted-foreground">{choice.value}</td>
                          <td className="py-2 text-sm">{pricingDisplay}</td>
                          <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {choice.requires_file_upload && (
                                <Badge variant="outline" className="text-xs">Upload</Badge>
                              )}
                              {choice.requires_sides_selection && (
                                <Badge variant="outline" className="text-xs">Sides</Badge>
                              )}
                              {!choice.requires_file_upload && !choice.requires_sides_selection && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  No choices configured yet. Add your first choice below.
                </p>
              </div>
            )}

            {/* Inline Add New Choice Form */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-4">Add New Choice</h4>
              <ChoiceForm addOnId={initialData?.id!} onSuccess={refreshChoices} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Behavior Settings</CardTitle>
          <CardDescription>Default behavior and turnaround impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMandatoryDefault"
                checked={isMandatoryDefault}
                onCheckedChange={(checked) => setIsMandatoryDefault(checked as boolean)}
              />
              <Label htmlFor="isMandatoryDefault" className="font-normal cursor-pointer">
                Mandatory by default (cannot be unchecked)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEnabledDefault"
                checked={isEnabledDefault}
                onCheckedChange={(checked) => setIsEnabledDefault(checked as boolean)}
              />
              <Label htmlFor="isEnabledDefault" className="font-normal cursor-pointer">
                Enabled by default (pre-selected but can be unchecked)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Active (visible to customers)
              </Label>
            </div>
          </div>

          {/* Turnaround Days */}
          <div className="space-y-2">
            <Label htmlFor="turnaroundDaysAdd">Additional Turnaround Days</Label>
            <Input
              id="turnaroundDaysAdd"
              type="number"
              min="0"
              value={turnaroundDaysAdd}
              onChange={(e) => setTurnaroundDaysAdd(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Days to add to production time when this addon is selected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Options */}
      <Card>
        <CardHeader>
          <CardTitle>Sub-Options</CardTitle>
          <CardDescription>
            Configuration fields that customers fill out when selecting this addon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddonSubOptionEditor subOptions={subOptions} onSubOptionsChange={setSubOptions} />
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
          <CardDescription>Internal notes (not visible to customers)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Internal notes, reminders, or special instructions..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create Add-On' : 'Save Changes'}
            </>
          )}
        </Button>

        <Link href="/admin/addons">
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
