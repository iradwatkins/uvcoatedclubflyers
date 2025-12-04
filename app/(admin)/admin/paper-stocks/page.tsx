'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
}

export default function PaperStocksPage() {
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedMarkups, setEditedMarkups] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchPaperStocks();
  }, []);

  const fetchPaperStocks = async () => {
    try {
      const response = await fetch('/api/admin/paper-stocks');
      if (response.ok) {
        const data = await response.json();
        setPaperStocks(data);
        // Initialize edited markups
        const markups: Record<number, string> = {};
        data.forEach((ps: PaperStock) => {
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
          Manage paper stock pricing and markup multipliers
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
          <CardTitle>Paper Stock Markups</CardTitle>
          <CardDescription>
            Set markup multipliers for each paper stock. The markup is applied before the turnaround
            multiplier in the pricing calculation.
            <br />
            <strong>Formula:</strong> markedUpCost = baseCost × markup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paper Stock</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Thickness</TableHead>
                <TableHead>Base Cost/sq in</TableHead>
                <TableHead>Weight/sq in</TableHead>
                <TableHead className="w-[150px]">Markup</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
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
                  <TableCell>${parseFloat(ps.base_cost_per_sq_in).toFixed(4)}</TableCell>
                  <TableCell>{parseFloat(ps.weight_per_sq_in).toFixed(6)} lbs</TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Formula Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="font-mono text-sm bg-muted p-4 rounded-lg">
            <div>Step 1: baseCost = paperStockPrice × sidesMultiplier × (width × height) × quantity</div>
            <div className="text-primary font-bold">Step 2: markedUpCost = baseCost × <span className="underline">paperStockMarkup</span></div>
            <div>Step 3: subtotal = markedUpCost × turnaroundMultiplier</div>
            <div>Step 4: totalPrice = subtotal + addOnsCost</div>
          </div>
          <p className="text-sm text-muted-foreground">
            The paper stock markup is applied BEFORE the turnaround multiplier, allowing you to
            adjust the base profit margin for each paper type independently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
