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
 * Component for selecting design/file upload option
 * Uses dropdown selector - file uploader shows by default when "Upload My Artwork" is selected
 * File uploader hides when other design services are selected
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

  // Sort design options by display order
  const sortedOptions = [...designOptions].sort((a, b) => a.display_order - b.display_order);

  // Get selected option details
  const selectedOption = sortedOptions.find((opt) => opt.id === selectedOptionId);

  // Auto-select "Upload My Artwork" (first option) if nothing is selected
  // Only runs once when options are loaded and no option is selected
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
  }, [sortedOptions.length]); // Only depend on options being loaded

  // Derive requirements from slug
  const requiresSidesSelection = selectedOption?.slug === 'standard-custom-design' ||
    selectedOption?.slug === 'rush-custom-design';
  // Note: "upload-my-artwork" is OPTIONAL - users can upload files later
  // Only design changes require files because they need existing artwork to modify
  const requiresUpload = selectedOption?.slug === 'design-changes-minor' ||
    selectedOption?.slug === 'design-changes-major';

  // Validate when selection changes
  useEffect(() => {
    if (!selectedOption) {
      setValidationError('');
      return;
    }

    // Check if sides selection is required but missing
    if (requiresSidesSelection && !selectedSides) {
      setValidationError('Please select the number of sides for your custom design.');
      return;
    }

    // Check if file upload is required but missing
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

  // Determine if file uploader should show based on slug
  // Show for: upload-my-artwork, design-changes-minor, design-changes-major
  const showFileUploader = selectedOption?.slug === 'upload-my-artwork' ||
    selectedOption?.slug === 'design-changes-minor' ||
    selectedOption?.slug === 'design-changes-major';

  // Determine if sides selection should show based on slug
  // Show for: standard-custom-design, rush-custom-design
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

        {/* File Upload Dropzone - Shows by default for upload options */}
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
