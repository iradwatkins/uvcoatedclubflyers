'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Save, Loader2, CheckCircle, AlertCircle, Settings, Droplets, Square } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Coating {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

interface CoatingAssignment {
  coating_id: number;
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
  sides_multiplier_single: string;
  sides_multiplier_double: string;
  is_active: boolean;
  coatings: CoatingAssignment[];
}

export default function PaperStocksPage() {
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([]);
  const [allCoatings, setAllCoatings] = useState<Coating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedMarkups, setEditedMarkups] = useState<Record<number, string>>({});
  const [editingPaperStock, setEditingPaperStock] = useState<PaperStock | null>(null);
  const [editedCoatings, setEditedCoatings] = useState<number[]>([]);
  const [editedSidesSingle, setEditedSidesSingle] = useState<string>('1.0');
  const [editedSidesDouble, setEditedSidesDouble] = useState<string>('1.0');

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
    setEditedSidesSingle(ps.sides_multiplier_single || '1.0');
    setEditedSidesDouble(ps.sides_multiplier_double || '1.0');
  };

  const handleCoatingToggle = (coatingId: number) => {
    setEditedCoatings(prev => {
      if (prev.includes(coatingId)) {
        return prev.filter(id => id !== coatingId);
      }
      return [...prev, coatingId];
    });
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
          sides_multiplier_single: parseFloat(editedSidesSingle),
          sides_multiplier_double: parseFloat(editedSidesDouble),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPaperStocks((prev) =>
          prev.map((ps) => (ps.id === editingPaperStock.id ? {
            ...ps,
            coatings: updated.coatings,
            sides_multiplier_single: updated.sides_multiplier_single,
            sides_multiplier_double: updated.sides_multiplier_double,
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
                      <Badge variant="outline" className="text-xs justify-start">
                        <Square className="h-3 w-3 mr-1" />
                        Single: {parseFloat(ps.sides_multiplier_single || '1').toFixed(2)}x
                      </Badge>
                      <Badge variant="outline" className="text-xs justify-start">
                        <span className="flex h-3 w-3 mr-1">
                          <Square className="h-2 w-2" /><Square className="h-2 w-2 -ml-1" />
                        </span>
                        Double: {parseFloat(ps.sides_multiplier_double || '1').toFixed(2)}x
                      </Badge>
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
              Set available coatings and sides multipliers for this paper stock.
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

            {/* Sides Section */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Square className="h-4 w-4" />
                Sides Pricing Multipliers
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Single-Sided</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3"
                      value={editedSidesSingle}
                      onChange={(e) => setEditedSidesSingle(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">x multiplier</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Double-Sided</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3"
                      value={editedSidesDouble}
                      onChange={(e) => setEditedSidesDouble(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">x multiplier</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                The multiplier is applied to the base cost based on customer&apos;s sides selection.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingPaperStock(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOptions}
              disabled={saving === editingPaperStock?.id || editedCoatings.length === 0}
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
          <CardTitle>Pricing Formula Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="font-mono text-sm bg-muted p-4 rounded-lg">
            <div>Step 1: baseCost = paperStockPrice × <span className="text-blue-600 font-bold underline">sidesMultiplier</span> × (width × height) × quantity</div>
            <div className="text-primary font-bold">Step 2: markedUpCost = baseCost × <span className="underline">paperStockMarkup</span></div>
            <div>Step 3: subtotal = markedUpCost × turnaroundMultiplier + <span className="text-purple-600 font-bold underline">coatingCost</span></div>
            <div>Step 4: totalPrice = subtotal + addOnsCost</div>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Coatings</strong> and <strong>Sides</strong> are mandatory customer selections.
            The sides multiplier adjusts the base paper cost, while coatings add their own cost to the subtotal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
