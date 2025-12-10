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
import { Save, Loader2, CheckCircle, AlertCircle, Settings, Droplets, Copy } from 'lucide-react';
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
  price_multiplier: string;
  is_active: boolean;
}

interface CoatingAssignment {
  coating_id: number;
  is_default: boolean;
}

interface SidesAssignment {
  sides_option_id: number;
  is_default: boolean;
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
  const [editedSidesOptions, setEditedSidesOptions] = useState<number[]>([]);
  const [defaultSidesOptionId, setDefaultSidesOptionId] = useState<number | null>(null);

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
    setEditedSidesOptions(ps.sidesOptions.map(s => s.sides_option_id));
    const defaultSides = ps.sidesOptions.find(s => s.is_default);
    setDefaultSidesOptionId(defaultSides?.sides_option_id || allSidesOptions[0]?.id || null);
  };

  const handleCoatingToggle = (coatingId: number) => {
    setEditedCoatings(prev => {
      if (prev.includes(coatingId)) {
        return prev.filter(id => id !== coatingId);
      }
      return [...prev, coatingId];
    });
  };

  const handleSidesToggle = (sidesOptionId: number) => {
    setEditedSidesOptions(prev => {
      if (prev.includes(sidesOptionId)) {
        // Don't allow removing the default option
        if (sidesOptionId === defaultSidesOptionId) {
          return prev;
        }
        return prev.filter(id => id !== sidesOptionId);
      }
      return [...prev, sidesOptionId];
    });
  };

  const handleDefaultSidesChange = (sidesOptionId: number) => {
    setDefaultSidesOptionId(sidesOptionId);
    // Ensure the default option is in the selected list
    if (!editedSidesOptions.includes(sidesOptionId)) {
      setEditedSidesOptions(prev => [...prev, sidesOptionId]);
    }
  };

  const handleSaveOptions = async () => {
    if (!editingPaperStock) return;

    setSaving(editingPaperStock.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/paper-stocks/${editingPaperStock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coatings: editedCoatings,
          sidesOptions: editedSidesOptions,
          defaultSidesOptionId: defaultSidesOptionId,
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
        multiplier: option?.price_multiplier || '1.0'
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paper Stocks</h1>
        <p className="text-muted-foreground">
          Manage paper stock pricing, coatings, and sides options
        </p>
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
                Sides Options
              </h4>
              <div className="space-y-3">
                {allSidesOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                    <Checkbox
                      id={`sides-${option.id}`}
                      checked={editedSidesOptions.includes(option.id)}
                      onCheckedChange={() => handleSidesToggle(option.id)}
                      disabled={option.id === defaultSidesOptionId}
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
                    <RadioGroup
                      value={defaultSidesOptionId?.toString()}
                      onValueChange={(val) => handleDefaultSidesChange(parseInt(val))}
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem
                          value={option.id.toString()}
                          id={`default-${option.id}`}
                          disabled={!editedSidesOptions.includes(option.id)}
                        />
                        <Label htmlFor={`default-${option.id}`} className="text-xs text-muted-foreground">
                          Default
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
              {editedSidesOptions.length === 0 && (
                <p className="text-sm text-destructive mt-2">
                  At least one sides option must be selected.
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
              disabled={saving === editingPaperStock?.id || editedCoatings.length === 0 || editedSidesOptions.length === 0}
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
