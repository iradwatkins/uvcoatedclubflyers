'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { FileUploadDropzone } from '@/components/file-upload-dropzone';

// ========================================
// NEW CHOICE-BASED INTERFACE
// ========================================

export interface DesignChoice {
  id: number;
  addOnId: number;
  value: string;
  label: string;
  description: string | null;
  priceType: string;
  basePrice: string;
  perUnitPrice: string;
  percentage: string;
  requiresFileUpload: boolean;
  requiresSidesSelection: boolean;
  sidesPricing: { one: number; two: number } | null;
  displayOrder: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface DesignAddOn {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  tooltip_text?: string;
  ui_component: string;
  choices: DesignChoice[];
}

export interface DesignOptionSelectorNewProps {
  designAddOn: DesignAddOn;
  selectedChoiceValue: string | null;
  onChoiceChange: (choiceValue: string, addOnId: number) => void;
  selectedSides?: string;
  onSidesChange?: (sides: string) => void;
  uploadedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

/**
 * Format price display for a choice
 */
const formatChoicePrice = (choice: DesignChoice): string => {
  const basePrice = parseFloat(choice.basePrice || '0');
  const perUnit = parseFloat(choice.perUnitPrice || '0');

  if (basePrice === 0 && perUnit === 0 && choice.priceType !== 'custom') {
    return '';
  }

  if (choice.priceType === 'custom' && choice.sidesPricing) {
    const onePrice = choice.sidesPricing.one || 0;
    return ` (from $${onePrice})`;
  }

  if (basePrice > 0) {
    return ` (+$${basePrice.toFixed(basePrice % 1 === 0 ? 0 : 2)})`;
  }

  if (perUnit > 0) {
    return ` (+$${perUnit.toFixed(4)}/pc)`;
  }

  return '';
};

/**
 * New Choice-Based Design Option Selector
 */
export function DesignOptionSelectorNew({
  designAddOn,
  selectedChoiceValue,
  onChoiceChange,
  selectedSides,
  onSidesChange,
  uploadedFiles = [],
  onFilesChange,
  maxFiles = 10,
  className,
}: DesignOptionSelectorNewProps) {
  const [validationError, setValidationError] = useState<string>('');

  const sortedChoices = [...(designAddOn.choices || [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const selectedChoice = sortedChoices.find((c) => c.value === selectedChoiceValue);

  // Auto-select default choice
  useEffect(() => {
    if (!selectedChoiceValue && sortedChoices.length > 0) {
      const defaultChoice = sortedChoices.find((c) => c.isDefault) || sortedChoices[0];
      onChoiceChange(defaultChoice.value, designAddOn.id);
    }
  }, [sortedChoices.length]);

  const requiresSidesSelection = selectedChoice?.requiresSidesSelection || false;

  const showFileUploader =
    selectedChoice?.value === 'upload-my-artwork' ||
    selectedChoice?.value === 'design-changes-minor' ||
    selectedChoice?.value === 'design-changes-major';

  useEffect(() => {
    if (!selectedChoice) {
      setValidationError('');
      return;
    }

    if (requiresSidesSelection && !selectedSides) {
      setValidationError('Please select the number of sides for your custom design.');
      return;
    }

    if (
      (selectedChoice.value === 'design-changes-minor' ||
        selectedChoice.value === 'design-changes-major') &&
      uploadedFiles.length === 0
    ) {
      setValidationError('Please upload your artwork files for design changes.');
      return;
    }

    setValidationError('');
  }, [selectedChoice, selectedSides, uploadedFiles, requiresSidesSelection]);

  const handleChoiceChange = (value: string) => {
    onChoiceChange(value, designAddOn.id);
    setValidationError('');
  };

  const getSidesPrice = (sides: 'one' | 'two'): string => {
    if (!selectedChoice?.sidesPricing) return '';
    return `$${selectedChoice.sidesPricing[sides]}`;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="design-service" className="text-base font-semibold">
            Design
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select value={selectedChoiceValue || ''} onValueChange={handleChoiceChange}>
            <SelectTrigger id="design-service" className="w-full">
              <SelectValue placeholder="Select design option" />
            </SelectTrigger>
            <SelectContent>
              {sortedChoices.map((choice) => (
                <SelectItem key={choice.id} value={choice.value}>
                  {choice.label}
                  {formatChoicePrice(choice)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChoice?.description && (
            <p className="text-sm text-muted-foreground">{selectedChoice.description}</p>
          )}
        </div>

        {requiresSidesSelection && (
          <div className="space-y-2">
            <Label htmlFor="design-sides" className="text-sm font-medium">
              How many sides need design?
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select value={selectedSides || ''} onValueChange={onSidesChange}>
              <SelectTrigger id="design-sides" className="w-full">
                <SelectValue placeholder="Select number of sides" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">One Side - {getSidesPrice('one')}</SelectItem>
                <SelectItem value="two">Two Sides - {getSidesPrice('two')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showFileUploader && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Your Artwork
              {(selectedChoice?.value === 'design-changes-minor' ||
                selectedChoice?.value === 'design-changes-major') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <FileUploadDropzone
              files={uploadedFiles}
              onFilesSelected={onFilesChange || (() => {})}
              maxFiles={maxFiles}
              acceptedFileTypes={[
                '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
                '.pdf', '.ai', '.eps', '.psd',
              ]}
            />
          </div>
        )}

        {selectedChoice?.value === 'will-upload-later' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can upload your files later from your dashboard after placing the order. Your
              order will not be processed until files are received.
            </AlertDescription>
          </Alert>
        )}

        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

// ========================================
// LEGACY INTERFACE (for backward compatibility)
// ========================================

export interface DesignOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  base_price: string;
  per_unit_price: string;
  ui_component?: string;
  display_order: number;
  // New: choices array for dropdown add-ons
  choices?: DesignChoice[];
}

export interface DesignOptionSelectorProps {
  designOptions: DesignOption[];
  selectedOptionId: number | null;
  onOptionChange: (optionId: number) => void;
  selectedSides?: string;
  onSidesChange?: (sides: string) => void;
  uploadedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

/**
 * Format price display for design option in dropdown
 */
const formatDesignOptionPrice = (option: DesignOption): string => {
  const basePrice = parseFloat(option.base_price || '0');
  const perUnitPrice = parseFloat(option.per_unit_price || '0');

  // Free options
  if (basePrice === 0 && perUnitPrice === 0) {
    return '';
  }

  // Custom design with sides-based pricing
  if (option.slug === 'standard-custom-design' || option.slug === 'rush-custom-design') {
    return ` (from $${basePrice.toFixed(0)})`;
  }

  // Flat pricing
  if (basePrice > 0) {
    return ` (+$${basePrice.toFixed(0)})`;
  }

  return '';
};

/**
 * Legacy Component for selecting design/file upload option
 * Now supports both old (separate add-ons) and new (single add-on with choices) formats
 */
export function DesignOptionSelector({
  designOptions,
  selectedOptionId,
  onOptionChange,
  selectedSides,
  onSidesChange,
  uploadedFiles = [],
  onFilesChange,
  maxFiles = 10,
  className,
}: DesignOptionSelectorProps) {
  const [validationError, setValidationError] = useState<string>('');

  // Check if we have the new choices-based format
  // (single "Design" add-on with choices array)
  const hasChoices = designOptions.length === 1 &&
    designOptions[0].ui_component === 'dropdown' &&
    designOptions[0].choices &&
    designOptions[0].choices.length > 0;

  // If using new format, use the inline implementation directly
  if (hasChoices) {
    const designAddOn = designOptions[0];
    const choices = designAddOn.choices || [];

    // Sort choices by display order
    const sortedChoices = [...choices].sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    // Find default choice or use first
    const defaultChoice = sortedChoices.find((c) => c.isDefault) || sortedChoices[0];

    // Use selectedOptionId to track which choice is selected by matching against choice values
    // We'll store the choice value in a derived way - find the choice that matches our selection
    const selectedChoice = selectedOptionId
      ? sortedChoices.find((c) => c.id === selectedOptionId) || defaultChoice
      : defaultChoice;

    // Auto-select default on mount if nothing selected
    useEffect(() => {
      if (!selectedOptionId && defaultChoice) {
        onOptionChange(defaultChoice.id);
      }
    }, []);

    const requiresSidesSelection = selectedChoice?.requiresSidesSelection || false;

    const showFileUploader =
      selectedChoice?.value === 'upload-my-artwork' ||
      selectedChoice?.value === 'design-changes-minor' ||
      selectedChoice?.value === 'design-changes-major';

    const getSidesPrice = (sides: 'one' | 'two'): string => {
      if (!selectedChoice?.sidesPricing) return '';
      return `$${selectedChoice.sidesPricing[sides]}`;
    };

    const formatChoicePrice = (choice: DesignChoice): string => {
      const basePrice = parseFloat(choice.basePrice || '0');
      const perUnit = parseFloat(choice.perUnitPrice || '0');

      if (basePrice === 0 && perUnit === 0 && choice.priceType !== 'custom') {
        return '';
      }

      if (choice.priceType === 'custom' && choice.sidesPricing) {
        const onePrice = choice.sidesPricing.one || 0;
        return ` (from $${onePrice})`;
      }

      if (basePrice > 0) {
        return ` (+$${basePrice.toFixed(basePrice % 1 === 0 ? 0 : 2)})`;
      }

      return '';
    };

    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="design-service" className="text-base font-semibold">
              Design
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={selectedChoice?.id?.toString() || ''}
              onValueChange={(value) => onOptionChange(parseInt(value))}
            >
              <SelectTrigger id="design-service" className="w-full">
                <SelectValue placeholder="Select design option" />
              </SelectTrigger>
              <SelectContent>
                {sortedChoices.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id.toString()}>
                    {choice.label}
                    {formatChoicePrice(choice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChoice?.description && (
              <p className="text-sm text-muted-foreground">{selectedChoice.description}</p>
            )}
          </div>

          {requiresSidesSelection && (
            <div className="space-y-2">
              <Label htmlFor="design-sides" className="text-sm font-medium">
                How many sides need design?
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={selectedSides || ''} onValueChange={onSidesChange}>
                <SelectTrigger id="design-sides" className="w-full">
                  <SelectValue placeholder="Select number of sides" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one">One Side - {getSidesPrice('one')}</SelectItem>
                  <SelectItem value="two">Two Sides - {getSidesPrice('two')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showFileUploader && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Upload Your Artwork
                {(selectedChoice?.value === 'design-changes-minor' ||
                  selectedChoice?.value === 'design-changes-major') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <FileUploadDropzone
                files={uploadedFiles}
                onFilesSelected={onFilesChange || (() => {})}
                maxFiles={maxFiles}
                acceptedFileTypes={[
                  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
                  '.pdf', '.ai', '.eps', '.psd',
                ]}
              />
            </div>
          )}

          {selectedChoice?.value === 'will-upload-later' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can upload your files later from your dashboard after placing the order. Your
                order will not be processed until files are received.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // LEGACY BEHAVIOR (multiple separate add-ons)
  // ========================================

  // Sort design options by display order
  const sortedOptions = [...designOptions].sort((a, b) => a.display_order - b.display_order);

  // Get selected option details
  const selectedOption = sortedOptions.find((opt) => opt.id === selectedOptionId);

  // Auto-select "Upload My Artwork" (first option) if nothing is selected
  useEffect(() => {
    if (selectedOptionId === null && sortedOptions.length > 0) {
      const uploadOption = sortedOptions.find(opt => opt.slug === 'upload-my-artwork');
      if (uploadOption) {
        onOptionChange(uploadOption.id);
      } else {
        onOptionChange(sortedOptions[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedOptions.length]);

  // Derive requirements from slug
  const requiresSidesSelection = selectedOption?.slug === 'standard-custom-design' ||
    selectedOption?.slug === 'rush-custom-design';
  const requiresUpload = selectedOption?.slug === 'design-changes-minor' ||
    selectedOption?.slug === 'design-changes-major';

  // Validate when selection changes
  useEffect(() => {
    if (!selectedOption) {
      setValidationError('');
      return;
    }

    if (requiresSidesSelection && !selectedSides) {
      setValidationError('Please select the number of sides for your custom design.');
      return;
    }

    if (requiresUpload && uploadedFiles.length === 0) {
      setValidationError('Please upload your artwork files.');
      return;
    }

    setValidationError('');
  }, [selectedOption, selectedSides, uploadedFiles, requiresSidesSelection, requiresUpload]);

  const handleOptionChange = (value: string) => {
    const optionId = parseInt(value);
    onOptionChange(optionId);
    setValidationError('');
  };

  const handleSidesChange = (value: string) => {
    if (onSidesChange) {
      onSidesChange(value);
    }
  };

  const handleFilesChange = (files: File[]) => {
    if (onFilesChange) {
      onFilesChange(files);
    }
  };

  const showFileUploader = selectedOption?.slug === 'upload-my-artwork' ||
    selectedOption?.slug === 'design-changes-minor' ||
    selectedOption?.slug === 'design-changes-major';

  const showSidesSelection = selectedOption?.slug === 'standard-custom-design' ||
    selectedOption?.slug === 'rush-custom-design';

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Design Services Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="design-service" className="text-base font-semibold">
            Design Services
          </Label>
          <Select
            value={selectedOptionId?.toString() || ''}
            onValueChange={handleOptionChange}
          >
            <SelectTrigger id="design-service" className="w-full">
              <SelectValue placeholder="Select design service" />
            </SelectTrigger>
            <SelectContent>
              {sortedOptions.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.name}{formatDesignOptionPrice(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOption?.description && (
            <p className="text-sm text-muted-foreground">
              {selectedOption.description}
            </p>
          )}
        </div>

        {/* Conditional: Sides Selection for Custom Design */}
        {showSidesSelection && (
          <div className="space-y-2">
            <Label htmlFor="design-sides" className="text-sm font-medium">
              How many sides?
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select value={selectedSides || ''} onValueChange={handleSidesChange}>
              <SelectTrigger id="design-sides" className="w-full">
                <SelectValue placeholder="Select number of sides" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">
                  One Side
                  {selectedOption.slug === 'standard-custom-design' && ' - $90'}
                  {selectedOption.slug === 'rush-custom-design' && ' - $160'}
                </SelectItem>
                <SelectItem value="two">
                  Two Sides
                  {selectedOption.slug === 'standard-custom-design' && ' - $135'}
                  {selectedOption.slug === 'rush-custom-design' && ' - $240'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* File Upload Dropzone */}
        {showFileUploader && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Your Artwork
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <FileUploadDropzone
              files={uploadedFiles}
              onFilesSelected={handleFilesChange}
              maxFiles={maxFiles}
              acceptedFileTypes={['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.pdf', '.ai', '.eps', '.psd']}
            />
          </div>
        )}

        {/* Info: Will Upload Later */}
        {selectedOption?.slug === 'will-upload-later' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can upload your files later from your dashboard after placing the order. Your
              order will not be processed until files are received.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
