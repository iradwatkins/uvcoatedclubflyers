'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react';

export interface SubOption {
  id?: string; // Temp ID for new options
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: string; // JSON string for select/radio/checkbox options
  defaultValue?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  displayOrder: number;
}

interface AddonSubOptionEditorProps {
  subOptions: SubOption[];
  onSubOptionsChange: (subOptions: SubOption[]) => void;
}

export function AddonSubOptionEditor({
  subOptions,
  onSubOptionsChange,
}: AddonSubOptionEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addSubOption = () => {
    const newSubOption: SubOption = {
      id: `temp-${Date.now()}`,
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      isRequired: false,
      displayOrder: subOptions.length,
    };
    onSubOptionsChange([...subOptions, newSubOption]);
    setExpandedIndex(subOptions.length);
  };

  const removeSubOption = (index: number) => {
    const updated = subOptions.filter((_, i) => i !== index);
    // Reorder display order
    updated.forEach((opt, i) => {
      opt.displayOrder = i;
    });
    onSubOptionsChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const updateSubOption = (index: number, field: keyof SubOption, value: any) => {
    const updated = [...subOptions];
    updated[index] = { ...updated[index], [field]: value };
    onSubOptionsChange(updated);
  };

  const moveSubOption = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= subOptions.length) return;

    const updated = [...subOptions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update display order
    updated.forEach((opt, i) => {
      opt.displayOrder = i;
    });

    onSubOptionsChange(updated);

    // Keep expanded state on moved item
    if (expandedIndex === index) {
      setExpandedIndex(newIndex);
    } else if (expandedIndex === newIndex) {
      setExpandedIndex(index);
    }
  };

  const generateFieldName = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Sub-Options</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add configuration fields that users fill out when selecting this addon
          </p>
        </div>
        <Button type="button" onClick={addSubOption} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Sub-Option
        </Button>
      </div>

      {subOptions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No sub-options defined. Sub-options are optional configuration fields for this addon.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {subOptions.map((subOption, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <Card key={subOption.id || index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium">
                      {subOption.fieldLabel || `Sub-Option #${index + 1}`}
                      {subOption.isRequired && (
                        <span className="ml-2 text-xs text-red-500">(Required)</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {subOption.fieldName || 'field_name'} • {subOption.fieldType}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSubOption(index, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < subOptions.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSubOption(index, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {/* Field Label */}
                  <div className="space-y-2">
                    <Label htmlFor={`label-${index}`}>
                      Field Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`label-${index}`}
                      value={subOption.fieldLabel}
                      onChange={(e) => {
                        updateSubOption(index, 'fieldLabel', e.target.value);
                        // Auto-generate field name if empty
                        if (!subOption.fieldName) {
                          updateSubOption(index, 'fieldName', generateFieldName(e.target.value));
                        }
                      }}
                      placeholder="e.g., Bundle Size"
                    />
                  </div>

                  {/* Field Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>
                      Field Name (slug) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`name-${index}`}
                      value={subOption.fieldName}
                      onChange={(e) => updateSubOption(index, 'fieldName', e.target.value)}
                      placeholder="e.g., bundle_size"
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier, lowercase with underscores
                    </p>
                  </div>

                  {/* Field Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`type-${index}`}>
                      Field Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={subOption.fieldType}
                      onValueChange={(value) => updateSubOption(index, 'fieldType', value)}
                    >
                      <SelectTrigger id={`type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="number">Number Input</SelectItem>
                        <SelectItem value="select">Dropdown (Select)</SelectItem>
                        <SelectItem value="radio">Radio Buttons</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options (for select/radio/checkbox) */}
                  {['select', 'radio', 'checkbox'].includes(subOption.fieldType) && (
                    <div className="space-y-2">
                      <Label htmlFor={`options-${index}`}>
                        Options (JSON Array)
                      </Label>
                      <Textarea
                        id={`options-${index}`}
                        value={subOption.options || ''}
                        onChange={(e) => updateSubOption(index, 'options', e.target.value)}
                        placeholder='["Option 1", "Option 2", "Option 3"]'
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter as JSON array: ["Option 1", "Option 2"]
                      </p>
                    </div>
                  )}

                  {/* Default Value */}
                  <div className="space-y-2">
                    <Label htmlFor={`default-${index}`}>Default Value</Label>
                    <Input
                      id={`default-${index}`}
                      value={subOption.defaultValue || ''}
                      onChange={(e) => updateSubOption(index, 'defaultValue', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Min/Max Values (for number fields) */}
                  {subOption.fieldType === 'number' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`min-${index}`}>Min Value</Label>
                        <Input
                          id={`min-${index}`}
                          type="number"
                          value={subOption.minValue || ''}
                          onChange={(e) => updateSubOption(index, 'minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`max-${index}`}>Max Value</Label>
                        <Input
                          id={`max-${index}`}
                          type="number"
                          value={subOption.maxValue || ''}
                          onChange={(e) => updateSubOption(index, 'maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pattern (for text fields) */}
                  {subOption.fieldType === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor={`pattern-${index}`}>Validation Pattern (Regex)</Label>
                      <Input
                        id={`pattern-${index}`}
                        value={subOption.pattern || ''}
                        onChange={(e) => updateSubOption(index, 'pattern', e.target.value)}
                        placeholder="e.g., ^[0-9]+$"
                      />
                    </div>
                  )}

                  {/* Is Required */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${index}`}
                      checked={subOption.isRequired}
                      onCheckedChange={(checked) => updateSubOption(index, 'isRequired', checked)}
                    />
                    <Label htmlFor={`required-${index}`} className="font-normal cursor-pointer">
                      This field is required
                    </Label>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
