'use client';

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload } from 'lucide-react';
import { FileUploadDropzone } from '@/components/file-upload-dropzone';

export interface DesignOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  base_price: string;
  per_unit_price: string;
  requires_upload: boolean;
  requires_sides_selection: boolean;
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
 * Format price display for design option
 */
const formatDesignOptionPrice = (option: DesignOption, sides?: string): string => {
  const basePrice = parseFloat(option.base_price || '0');
  const perUnitPrice = parseFloat(option.per_unit_price || '0');

  // Free options
  if (basePrice === 0 && perUnitPrice === 0) {
    return 'FREE';
  }

  // Custom design with sides-based pricing
  if (option.slug === 'standard-custom-design' || option.slug === 'rush-custom-design') {
    if (sides === 'one') {
      return `+$${basePrice.toFixed(2)}`;
    } else if (sides === 'two') {
      return `+$${perUnitPrice.toFixed(2)}`;
    }
    return `$${basePrice.toFixed(2)} / $${perUnitPrice.toFixed(2)}`;
  }

  // Flat pricing
  if (basePrice > 0) {
    return `+$${basePrice.toFixed(2)}`;
  }

  return '';
};

/**
 * Component for selecting design/file upload option
 * Always appears above turnaround time as core product configuration
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

  // Validate when selection changes
  useEffect(() => {
    if (!selectedOption) {
      setValidationError('');
      return;
    }

    // Check if sides selection is required but missing
    if (selectedOption.requires_sides_selection && !selectedSides) {
      setValidationError('Please select the number of sides for your custom design.');
      return;
    }

    // Check if file upload is required but missing
    if (selectedOption.requires_upload && uploadedFiles.length === 0) {
      setValidationError('Please upload your artwork files.');
      return;
    }

    setValidationError('');
  }, [selectedOption, selectedSides, uploadedFiles]);

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

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Design Options Radio Group */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Design & Files
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <RadioGroup value={selectedOptionId?.toString() || ''} onValueChange={handleOptionChange}>
            <div className="space-y-2">
              {sortedOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem
                    value={option.id.toString()}
                    id={`design-option-${option.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`design-option-${option.id}`}
                      className="cursor-pointer font-medium leading-none"
                    >
                      <div className="flex items-center gap-2">
                        <span>{option.name}</span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatDesignOptionPrice(option, selectedSides)}
                        </span>
                      </div>
                      {option.description && (
                        <p className="mt-1 text-sm text-muted-foreground font-normal">
                          {option.description}
                        </p>
                      )}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Conditional: Sides Selection for Custom Design */}
        {selectedOption?.requires_sides_selection && (
          <div className="ml-8 space-y-2">
            <Label htmlFor="design-sides" className="text-sm font-medium">
              How many sides?
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select value={selectedSides || ''} onValueChange={handleSidesChange}>
              <SelectTrigger id="design-sides" className="w-full max-w-xs">
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

        {/* Conditional: File Upload Dropzone */}
        {selectedOption?.requires_upload && (
          <div className="ml-8 space-y-2">
            <Label className="text-sm font-medium">
              Upload Your Files
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <FileUploadDropzone
              onFilesSelected={handleFilesChange}
              maxFiles={maxFiles}
              acceptedFileTypes={{
                'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
                'application/pdf': ['.pdf'],
                'application/postscript': ['.ai', '.eps'],
                'image/vnd.adobe.photoshop': ['.psd'],
                'application/illustrator': ['.ai'],
              }}
            />
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
              </p>
            )}
          </div>
        )}

        {/* Info: Will Upload Later */}
        {selectedOption?.slug === 'will-upload-later' && (
          <Alert className="ml-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can upload your files later from your dashboard after placing the order. Your
              order will not be processed until files are received.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive" className="ml-8">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Helper Text */}
        {!selectedOption && (
          <p className="text-xs text-muted-foreground ml-8">
            Please select how you'd like to provide your design files.
          </p>
        )}
      </div>
    </div>
  );
}
