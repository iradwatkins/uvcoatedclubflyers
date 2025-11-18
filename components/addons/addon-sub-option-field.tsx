'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';

/**
 * Types for sub-option fields based on database schema
 */
export interface AddOnSubOptionConfig {
  id: number;
  addOnId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'select' | 'text' | 'number' | 'checkbox' | 'textarea';
  options?: string | null; // JSON string of options array
  defaultValue?: string | null;
  isRequired: boolean;
  affectsPricing: boolean;
  tooltip?: string | null;
  displayOrder: number;
  showWhen?: string | null; // Conditional display logic (e.g., "verticalCount > 0")
}

export interface AddOnSubOptionFieldProps {
  config: AddOnSubOptionConfig;
  value: any;
  onChange: (value: any) => void;
  parentValues?: Record<string, any>; // Values of other fields for conditional logic
}

/**
 * Parse options JSON string to array
 */
const parseOptions = (optionsString: string | null | undefined): string[] => {
  if (!optionsString) return [];

  try {
    // Handle both JSON array and JSON object formats
    const parsed = JSON.parse(optionsString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed.options && Array.isArray(parsed.options)) {
      return parsed.options;
    }
    return [];
  } catch (e) {
    // If it's a comma-separated string, split it
    if (typeof optionsString === 'string' && optionsString.includes(',')) {
      return optionsString.split(',').map(opt => opt.trim());
    }
    return [];
  }
};

/**
 * Evaluate conditional display logic
 */
const evaluateShowWhen = (
  showWhen: string | null | undefined,
  parentValues: Record<string, any>
): boolean => {
  if (!showWhen) return true;

  try {
    // Simple evaluation for common patterns
    // Examples: "verticalCount > 0", "drillType === 'binder'"

    // Extract field name, operator, and value
    const match = showWhen.match(/(\w+)\s*(>|<|===|!==|>=|<=)\s*(.+)/);
    if (!match) return true;

    const [, fieldName, operator, valueStr] = match;
    const fieldValue = parentValues[fieldName];
    const compareValue = isNaN(Number(valueStr)) ? valueStr.replace(/['"]/g, '') : Number(valueStr);

    switch (operator) {
      case '>':
        return Number(fieldValue) > Number(compareValue);
      case '<':
        return Number(fieldValue) < Number(compareValue);
      case '>=':
        return Number(fieldValue) >= Number(compareValue);
      case '<=':
        return Number(fieldValue) <= Number(compareValue);
      case '===':
        return fieldValue === compareValue;
      case '!==':
        return fieldValue !== compareValue;
      default:
        return true;
    }
  } catch (e) {
    console.error('Error evaluating showWhen:', e);
    return true;
  }
};

/**
 * Reusable sub-option field component
 * Renders different input types based on field configuration
 */
export function AddOnSubOptionField({
  config,
  value,
  onChange,
  parentValues = {},
}: AddOnSubOptionFieldProps) {
  // Check conditional display
  const shouldShow = evaluateShowWhen(config.showWhen, parentValues);

  if (!shouldShow) {
    return null;
  }

  const fieldId = `field-${config.id}`;

  // Render based on field type
  switch (config.fieldType) {
    case 'select': {
      const options = parseOptions(config.options);

      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {config.fieldLabel}
            {config.isRequired && <span className="text-red-500">*</span>}
            {config.tooltip && (
              <span className="text-muted-foreground" title={config.tooltip}>
                <Info className="h-4 w-4" />
              </span>
            )}
          </Label>
          <Select
            value={value?.toString() || config.defaultValue?.toString() || ''}
            onValueChange={onChange}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder={`Select ${config.fieldLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {config.tooltip && (
            <p className="text-xs text-muted-foreground">{config.tooltip}</p>
          )}
        </div>
      );
    }

    case 'number': {
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {config.fieldLabel}
            {config.isRequired && <span className="text-red-500">*</span>}
            {config.tooltip && (
              <span className="text-muted-foreground" title={config.tooltip}>
                <Info className="h-4 w-4" />
              </span>
            )}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={value?.toString() || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={config.fieldLabel}
            min={0}
          />
          {config.tooltip && (
            <p className="text-xs text-muted-foreground">{config.tooltip}</p>
          )}
        </div>
      );
    }

    case 'text': {
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {config.fieldLabel}
            {config.isRequired && <span className="text-red-500">*</span>}
            {config.tooltip && (
              <span className="text-muted-foreground" title={config.tooltip}>
                <Info className="h-4 w-4" />
              </span>
            )}
          </Label>
          <Input
            id={fieldId}
            type="text"
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.fieldLabel}
          />
          {config.tooltip && (
            <p className="text-xs text-muted-foreground">{config.tooltip}</p>
          )}
        </div>
      );
    }

    case 'textarea': {
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {config.fieldLabel}
            {config.isRequired && <span className="text-red-500">*</span>}
            {config.tooltip && (
              <span className="text-muted-foreground" title={config.tooltip}>
                <Info className="h-4 w-4" />
              </span>
            )}
          </Label>
          <Textarea
            id={fieldId}
            value={value || config.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.fieldLabel}
            rows={3}
          />
          {config.tooltip && (
            <p className="text-xs text-muted-foreground">{config.tooltip}</p>
          )}
        </div>
      );
    }

    case 'checkbox': {
      return (
        <div className="flex items-start space-x-2">
          <Checkbox
            id={fieldId}
            checked={value || false}
            onCheckedChange={onChange}
          />
          <div className="flex-1">
            <Label
              htmlFor={fieldId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
            >
              {config.fieldLabel}
              {config.isRequired && <span className="text-red-500">*</span>}
              {config.tooltip && (
                <span className="text-muted-foreground" title={config.tooltip}>
                  <Info className="h-4 w-4" />
                </span>
              )}
            </Label>
            {config.tooltip && (
              <p className="text-xs text-muted-foreground mt-1">{config.tooltip}</p>
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
