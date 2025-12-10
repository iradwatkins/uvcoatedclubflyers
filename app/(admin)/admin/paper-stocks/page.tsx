'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, Loader2, CheckCircle, AlertCircle, Settings, Droplets, Copy, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Coating {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

interface SidesOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  // Note: price_multiplier is NOT on this master table
  // It's stored per-paper-stock on the paper_stock_sides junction table
}

interface CoatingAssignment {
  coating_id: number;
  is_default: boolean;
}

interface SidesAssignment {
  sides_option_id: number;
  is_default: boolean;
  price_multiplier: string;
}

interface PaperStock {
  id: number;
  name: string;
  slug: string;
  type: string;
  thickness: string;
  base_cost_per_sq_in: string;
  weight_per_sq_in: string;
  markup: string;
  is_active: boolean;
  coatings: CoatingAssignment[];
  sidesOptions: SidesAssignment[];
}

export default function PaperStocksPage() {
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([]);
  const [allCoatings, setAllCoatings] = useState<Coating[]>([]);
  const [allSidesOptions, setAllSidesOptions] = useState<SidesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedMarkups, setEditedMarkups] = useState<Record<number, string>>({});
  const [editingPaperStock, setEditingPaperStock] = useState<PaperStock | null>(null);
  const [editedCoatings, setEditedCoatings] = useState<number[]>([]);
  const [editedSidesOptions, setEditedSidesOptions] = useState<{ sides_option_id: number; is_default: boolean; price_multiplier: string }[]>([]);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPaperStock, setNewPaperStock] = useState({
    name: '',
    slug: '',
    type: 'cardstock',
    thickness: '',
    base_cost_per_sq_in: '0.0001',
    weight_per_sq_in: '0.000001',
    markup: '1.75',
    is_active: true,
  });
  const [newCoatings, setNewCoatings] = useState<number[]>([]);
  const [newSidesOptions, setNewSidesOptions] = useState<{ sides_option_id: number; is_default: boolean; price_multiplier: string }[]>([]);

  useEffect(() => {
    fetchPaperStocks();
  }, []);

  const fetchPaperStocks = async () => {
    try {
      const response = await fetch('/api/admin/paper-stocks');
      if (response.ok) {
        const data = await response.json();
        setPaperStocks(data.paperStocks || data);
        setAllCoatings(data.allCoatings || []);
        setAllSidesOptions(data.allSidesOptions || []);
        // Initialize edited markups
        const markups: Record<number, string> = {};
        (data.paperStocks || data).forEach((ps: PaperStock) => {
          markups[ps.id] = ps.markup || '1.0';
        });
        setEditedMarkups(markups);
      }
    } catch (err) {
      setError('Failed to load paper stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkupChange = (id: number, value: string) => {
    setEditedMarkups((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveMarkup = async (id: number) => {
    setSaving(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/paper-stocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markup: parseFloat(editedMarkups[id]) }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPaperStocks((prev) =>
          prev.map((ps) => (ps.id === id ? { ...ps, markup: updated.markup } : ps))
        );
        setSuccess(`${paperStocks.find((ps) => ps.id === id)?.name} markup updated successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update markup');
      }
    } catch (err) {
      setError('Failed to update markup');
    } finally {
      setSaving(null);
    }
  };

  const hasChanged = (id: number) => {
    const original = paperStocks.find((ps) => ps.id === id)?.markup || '1.0';
    return parseFloat(editedMarkups[id] || '1.0') !== parseFloat(original);
  };

  const openEditDialog = (ps: PaperStock) => {
    setEditingPaperStock(ps);
    setEditedCoatings(ps.coatings.map(c => c.coating_id));
    // Initialize with existing assignments or create new ones for all options
    const existingSides = ps.sidesOptions.map(s => ({
      sides_option_id: s.sides_option_id,
      is_default: s.is_default,
      price_multiplier: s.price_multiplier || '1.0'
    }));
    // Add any sides options that are not yet assigned with default values
    allSidesOptions.forEach(opt => {
      if (!existingSides.find(s => s.sides_option_id === opt.id)) {
        existingSides.push({
          sides_option_id: opt.id,
          is_default: false,
          price_multiplier: '1.0'
        });
      }
    });
    setEditedSidesOptions(existingSides);
  };

  const handleCoatingToggle = (coatingId: number) => {
    setEditedCoatings(prev => {
      if (prev.includes(coatingId)) {
        return prev.filter(id => id !== coatingId);
      }
      return [...prev, coatingId];
    });
  };

  const handleSidesToggle = (sidesOptionId: number, enabled: boolean) => {
    setEditedSidesOptions(prev => {
      const existing = prev.find(s => s.sides_option_id === sidesOptionId);
      if (existing) {
        // Don't allow disabling the default option
        if (!enabled && existing.is_default) {
          return prev;
        }
        // If disabling, mark as not part of selection (we'll filter when saving)
        return prev.map(s =>
          s.sides_option_id === sidesOptionId
            ? { ...s, _enabled: enabled } as any
            : s
        );
      }
      return prev;
    });
  };

  const isSidesEnabled = (sidesOptionId: number) => {
    const opt = editedSidesOptions.find(s => s.sides_option_id === sidesOptionId);
    // Check if it's marked as enabled, or if it has a paper stock assignment already
    if (!opt) return false;
    if ('_enabled' in opt) return (opt as any)._enabled;
    return true; // Existing assignments are enabled by default
  };

  const handleDefaultSidesChange = (sidesOptionId: number) => {
    setEditedSidesOptions(prev => prev.map(s => ({
      ...s,
      is_default: s.sides_option_id === sidesOptionId,
      _enabled: s.sides_option_id === sidesOptionId ? true : ('_enabled' in s ? (s as any)._enabled : true)
    } as any)));
  };

  const handlePriceMultiplierChange = (sidesOptionId: number, value: string) => {
    setEditedSidesOptions(prev => prev.map(s =>
      s.sides_option_id === sidesOptionId
        ? { ...s, price_multiplier: value }
        : s
    ));
  };

  const getEnabledSidesOptions = () => {
    return editedSidesOptions.filter(s => {
      if ('_enabled' in s) return (s as any)._enabled;
      return true;
    });
  };

  const handleSaveOptions = async () => {
    if (!editingPaperStock) return;

    const enabledSides = getEnabledSidesOptions();
    if (enabledSides.length === 0) {
      setError('At least one sides option must be enabled');
      return;
    }

    setSaving(editingPaperStock.id);
    setError(null);

    try {
      // Send sides options with price_multiplier per paper stock
      const sidesPayload = enabledSides.map(s => ({
        sides_option_id: s.sides_option_id,
        is_default: s.is_default,
        price_multiplier: parseFloat(s.price_multiplier) || 1.0
      }));

      const response = await fetch(`/api/admin/paper-stocks/${editingPaperStock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coatings: editedCoatings,
          sidesOptions: sidesPayload,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPaperStocks((prev) =>
          prev.map((ps) => (ps.id === editingPaperStock.id ? {
            ...ps,
            coatings: updated.coatings,
            sidesOptions: updated.sidesOptions,
          } : ps))
        );
        setSuccess(`${editingPaperStock.name} options updated successfully`);
        setTimeout(() => setSuccess(null), 3000);
        setEditingPaperStock(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update options');
      }
    } catch (err) {
      setError('Failed to update options');
    } finally {
      setSaving(null);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openCreateDialog = () => {
    setNewPaperStock({
      name: '',
      slug: '',
      type: 'cardstock',
      thickness: '',
      base_cost_per_sq_in: '0.0001',
      weight_per_sq_in: '0.000001',
      markup: '1.75',
      is_active: true,
    });
    // Initialize all coatings as selected
    setNewCoatings(allCoatings.map(c => c.id));
    // Initialize all sides options with default multiplier of 1.0
    setNewSidesOptions(allSidesOptions.map((opt, idx) => ({
      sides_option_id: opt.id,
      is_default: idx === 0, // First one is default
      price_multiplier: '1.0',
    })));
    setCreateDialogOpen(true);
  };

  const handleCreateNameChange = (name: string) => {
    setNewPaperStock(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleNewCoatingToggle = (coatingId: number) => {
    setNewCoatings(prev => {
      if (prev.includes(coatingId)) {
        return prev.filter(id => id !== coatingId);
      }
      return [...prev, coatingId];
    });
  };

  const handleNewSidesToggle = (sidesOptionId: number, enabled: boolean) => {
    setNewSidesOptions(prev => {
      const existing = prev.find(s => s.sides_option_id === sidesOptionId);
      if (existing) {
        if (!enabled && existing.is_default) return prev;
        return prev.map(s =>
          s.sides_option_id === sidesOptionId
            ? { ...s, _enabled: enabled } as any
            : s
        );
      }
      return prev;
    });
  };

  const isNewSidesEnabled = (sidesOptionId: number) => {
    const opt = newSidesOptions.find(s => s.sides_option_id === sidesOptionId);
    if (!opt) return false;
    if ('_enabled' in opt) return (opt as any)._enabled;
    return true;
  };

  const handleNewDefaultSidesChange = (sidesOptionId: number) => {
    setNewSidesOptions(prev => prev.map(s => ({
      ...s,
      is_default: s.sides_option_id === sidesOptionId,
      _enabled: s.sides_option_id === sidesOptionId ? true : ('_enabled' in s ? (s as any)._enabled : true)
    } as any)));
  };

  const handleNewPriceMultiplierChange = (sidesOptionId: number, value: string) => {
    setNewSidesOptions(prev => prev.map(s =>
      s.sides_option_id === sidesOptionId
        ? { ...s, price_multiplier: value }
        : s
    ));
  };

  const getEnabledNewSidesOptions = () => {
    return newSidesOptions.filter(s => {
      if ('_enabled' in s) return (s as any)._enabled;
      return true;
    });
  };

  const handleCreatePaperStock = async () => {
    if (!newPaperStock.name) {
      setError('Name is required');
      return;
    }

    const enabledSides = getEnabledNewSidesOptions();
    if (enabledSides.length === 0) {
      setError('At least one sides option must be enabled');
      return;
    }

    if (newCoatings.length === 0) {
      setError('At least one coating must be selected');
      return;
    }

    setSaving(-1); // -1 indicates creating
    setError(null);

    try {
      const sidesPayload = enabledSides.map(s => ({
        sides_option_id: s.sides_option_id,
        is_default: s.is_default,
        price_multiplier: parseFloat(s.price_multiplier) || 1.0
      }));

      const response = await fetch('/api/admin/paper-stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPaperStock,
          base_cost_per_sq_in: parseFloat(newPaperStock.base_cost_per_sq_in),
          weight_per_sq_in: parseFloat(newPaperStock.weight_per_sq_in),
          markup: parseFloat(newPaperStock.markup),
          coatings: newCoatings,
          sidesOptions: sidesPayload,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setPaperStocks(prev => [...prev, created]);
        setEditedMarkups(prev => ({ ...prev, [created.id]: created.markup }));
        setSuccess(`"${created.name}" created successfully`);
        setTimeout(() => setSuccess(null), 3000);
        setCreateDialogOpen(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create paper stock');
      }
    } catch (err) {
      setError('Failed to create paper stock');
    } finally {
      setSaving(null);
    }
  };

  const getCoatingNames = (coatings: CoatingAssignment[]) => {
    return coatings.map(c => {
      const coating = allCoatings.find(ac => ac.id === c.coating_id);
      return coating?.name || `ID:${c.coating_id}`;
    });
  };

  const getSidesOptionInfo = (sidesOptions: SidesAssignment[]) => {
    return sidesOptions.map(s => {
      const option = allSidesOptions.find(so => so.id === s.sides_option_id);
      return {
        name: option?.name || `ID:${s.sides_option_id}`,
        isDefault: s.is_default,
        // Use the price_multiplier from paper stock assignment, not from global sides option
        multiplier: s.price_multiplier || '1.0'
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paper Stocks</h1>
          <p className="text-muted-foreground">
            Manage paper stock pricing, coatings, and sides options
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Paper Stock
        </Button>
      </div>

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Paper Stock Configuration</CardTitle>
          <CardDescription>
            Configure markup, coating options, and sides for each paper stock.
            Coatings and sides are <strong>mandatory customer selections</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paper Stock</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Thickness</TableHead>
                <TableHead>Available Coatings</TableHead>
                <TableHead>Sides Options</TableHead>
                <TableHead className="w-[120px]">Markup</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paperStocks.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell>
                    <div className="font-medium">{ps.name}</div>
                    {!ps.is_active && (
                      <Badge variant="secondary" className="mt-1">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ps.type}</Badge>
                  </TableCell>
                  <TableCell>{ps.thickness}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ps.coatings.length === 0 ? (
                        <span className="text-muted-foreground text-sm">None configured</span>
                      ) : (
                        getCoatingNames(ps.coatings).map((name, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            {name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {ps.sidesOptions.length === 0 ? (
                        <span className="text-muted-foreground text-sm">None configured</span>
                      ) : (
                        getSidesOptionInfo(ps.sidesOptions).map((opt, i) => (
                          <Badge
                            key={i}
                            variant={opt.isDefault ? 'default' : 'outline'}
                            className="text-xs justify-start"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {opt.name}
                            <span className="ml-1 text-[10px]">
                              ({parseFloat(opt.multiplier).toFixed(2)}x)
                              {opt.isDefault && ' default'}
                            </span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={editedMarkups[ps.id] || '1.0'}
                        onChange={(e) => handleMarkupChange(ps.id, e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">x</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(ps)}
                        title="Configure coatings and sides"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveMarkup(ps.id)}
                        disabled={saving === ps.id || !hasChanged(ps.id)}
                      >
                        {saving === ps.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPaperStock} onOpenChange={() => setEditingPaperStock(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure {editingPaperStock?.name}</DialogTitle>
            <DialogDescription>
              Set available coatings and sides options for this paper stock.
              These are mandatory options customers must select when ordering.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Coatings Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Available Coatings
              </h4>
              <div className="space-y-2">
                {allCoatings.map((coating) => (
                  <div key={coating.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`coating-${coating.id}`}
                      checked={editedCoatings.includes(coating.id)}
                      onCheckedChange={() => handleCoatingToggle(coating.id)}
                    />
                    <label
                      htmlFor={`coating-${coating.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                    >
                      {coating.name}
                      {coating.description && (
                        <span className="text-muted-foreground ml-2 font-normal">
                          - {coating.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              {editedCoatings.length === 0 && (
                <p className="text-sm text-destructive mt-2">
                  At least one coating option must be selected.
                </p>
              )}
            </div>

            {/* Sides Options Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Sides Options & Price Multipliers
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Set which sides options are available for this paper stock and their price multipliers.
              </p>
              <div className="space-y-3">
                {allSidesOptions.map((option) => {
                  const editedOpt = editedSidesOptions.find(s => s.sides_option_id === option.id);
                  const isEnabled = isSidesEnabled(option.id);
                  const isDefault = editedOpt?.is_default || false;
                  const currentMultiplier = editedOpt?.price_multiplier || '1.0';

                  return (
                    <div key={option.id} className={`p-3 border rounded-lg ${!isEnabled ? 'opacity-50 bg-muted/50' : ''}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Checkbox
                          id={`sides-${option.id}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleSidesToggle(option.id, !!checked)}
                          disabled={isDefault}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`sides-${option.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {option.name}
                          </label>
                          {option.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroup
                            value={editedSidesOptions.find(s => s.is_default)?.sides_option_id?.toString() || ''}
                            onValueChange={(val) => handleDefaultSidesChange(parseInt(val))}
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem
                                value={option.id.toString()}
                                id={`default-${option.id}`}
                                disabled={!isEnabled}
                              />
                              <Label htmlFor={`default-${option.id}`} className="text-xs text-muted-foreground">
                                Default
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      {isEnabled && (
                        <div className="ml-7 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Price Multiplier:</Label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="10"
                            value={currentMultiplier}
                            onChange={(e) => handlePriceMultiplierChange(option.id, e.target.value)}
                            className="w-20 h-7 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">x base price</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {getEnabledSidesOptions().length === 0 && (
                <p className="text-sm text-destructive mt-2">
                  At least one sides option must be enabled.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingPaperStock(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOptions}
              disabled={saving === editingPaperStock?.id || editedCoatings.length === 0 || getEnabledSidesOptions().length === 0}
            >
              {saving === editingPaperStock?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Options
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Paper Stock Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Paper Stock</DialogTitle>
            <DialogDescription>
              Add a new paper stock with coatings and sides options configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name *</Label>
                <Input
                  id="new-name"
                  value={newPaperStock.name}
                  onChange={(e) => handleCreateNameChange(e.target.value)}
                  placeholder="e.g., 18pt C2S Cardstock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-slug">Slug</Label>
                <Input
                  id="new-slug"
                  value={newPaperStock.slug}
                  onChange={(e) => setNewPaperStock(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., 18pt-c2s"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-type">Type</Label>
                <Select
                  value={newPaperStock.type}
                  onValueChange={(val) => setNewPaperStock(prev => ({ ...prev, type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardstock">Cardstock</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-thickness">Thickness</Label>
                <Input
                  id="new-thickness"
                  value={newPaperStock.thickness}
                  onChange={(e) => setNewPaperStock(prev => ({ ...prev, thickness: e.target.value }))}
                  placeholder="e.g., 18pt"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-markup">Markup</Label>
                <Input
                  id="new-markup"
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={newPaperStock.markup}
                  onChange={(e) => setNewPaperStock(prev => ({ ...prev, markup: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-base-cost">Base Cost/sq in</Label>
                <Input
                  id="new-base-cost"
                  type="number"
                  step="0.0001"
                  value={newPaperStock.base_cost_per_sq_in}
                  onChange={(e) => setNewPaperStock(prev => ({ ...prev, base_cost_per_sq_in: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-weight">Weight/sq in</Label>
                <Input
                  id="new-weight"
                  type="number"
                  step="0.000001"
                  value={newPaperStock.weight_per_sq_in}
                  onChange={(e) => setNewPaperStock(prev => ({ ...prev, weight_per_sq_in: e.target.value }))}
                />
              </div>
            </div>

            {/* Coatings Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Available Coatings
              </h4>
              <div className="space-y-2">
                {allCoatings.map((coating) => (
                  <div key={coating.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new-coating-${coating.id}`}
                      checked={newCoatings.includes(coating.id)}
                      onCheckedChange={() => handleNewCoatingToggle(coating.id)}
                    />
                    <label
                      htmlFor={`new-coating-${coating.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {coating.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sides Options Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Sides Options & Price Multipliers
              </h4>
              <div className="space-y-3">
                {allSidesOptions.map((option) => {
                  const editedOpt = newSidesOptions.find(s => s.sides_option_id === option.id);
                  const isEnabled = isNewSidesEnabled(option.id);
                  const isDefault = editedOpt?.is_default || false;
                  const currentMultiplier = editedOpt?.price_multiplier || '1.0';

                  return (
                    <div key={option.id} className={`p-3 border rounded-lg ${!isEnabled ? 'opacity-50 bg-muted/50' : ''}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Checkbox
                          id={`new-sides-${option.id}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleNewSidesToggle(option.id, !!checked)}
                          disabled={isDefault}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`new-sides-${option.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {option.name}
                          </label>
                        </div>
                        <RadioGroup
                          value={newSidesOptions.find(s => s.is_default)?.sides_option_id?.toString() || ''}
                          onValueChange={(val) => handleNewDefaultSidesChange(parseInt(val))}
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`new-default-${option.id}`}
                              disabled={!isEnabled}
                            />
                            <Label htmlFor={`new-default-${option.id}`} className="text-xs text-muted-foreground">
                              Default
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {isEnabled && (
                        <div className="ml-7 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Price Multiplier:</Label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0.1"
                            max="10"
                            value={currentMultiplier}
                            onChange={(e) => handleNewPriceMultiplierChange(option.id, e.target.value)}
                            className="w-20 h-7 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">x base price</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePaperStock}
              disabled={saving === -1 || newCoatings.length === 0 || getEnabledNewSidesOptions().length === 0}
            >
              {saving === -1 ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Paper Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Customer Selection Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When a customer selects a paper stock, they must choose from the configured options:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4" />
                Coating Options
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>No Coating</li>
                <li>Gloss Aqueous</li>
                <li>Matte Aqueous</li>
                <li>UV One Side</li>
                <li>UV Both Sides</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Copy className="h-4 w-4" />
                Sides Options
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Same Image Both Sides</strong> (default)</li>
                <li>Different Image Both Sides</li>
                <li>Image Front Only / Blank Back</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
