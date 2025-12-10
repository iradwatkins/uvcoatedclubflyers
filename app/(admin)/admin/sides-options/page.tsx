'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Copy,
  GripVertical,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SidesOption {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_multiplier: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface EditForm {
  name: string;
  slug: string;
  description: string;
  price_multiplier: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: EditForm = {
  name: '',
  slug: '',
  description: '',
  price_multiplier: '1.0',
  is_active: true,
  display_order: 0,
};

export default function SidesOptionsPage() {
  const [sidesOptions, setSidesOptions] = useState<SidesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SidesOption | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOption, setDeletingOption] = useState<SidesOption | null>(null);

  useEffect(() => {
    fetchSidesOptions();
  }, []);

  const fetchSidesOptions = async () => {
    try {
      const response = await fetch('/api/admin/sides-options');
      if (response.ok) {
        const data = await response.json();
        setSidesOptions(data);
      }
    } catch (err) {
      setError('Failed to load sides options');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setEditForm((prev) => ({
      ...prev,
      name,
      slug: editingOption ? prev.slug : generateSlug(name),
    }));
  };

  const openCreateDialog = () => {
    setEditingOption(null);
    setEditForm({
      ...emptyForm,
      display_order: sidesOptions.length + 1,
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (option: SidesOption) => {
    setEditingOption(option);
    setEditForm({
      name: option.name,
      slug: option.slug,
      description: option.description || '',
      price_multiplier: option.price_multiplier,
      is_active: option.is_active,
      display_order: option.display_order,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.slug) {
      setError('Name and slug are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingOption
        ? `/api/admin/sides-options/${editingOption.id}`
        : '/api/admin/sides-options';
      const method = editingOption ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          description: editForm.description || null,
          price_multiplier: parseFloat(editForm.price_multiplier),
          is_active: editForm.is_active,
          display_order: editForm.display_order,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        if (editingOption) {
          setSidesOptions((prev) =>
            prev.map((opt) => (opt.id === saved.id ? saved : opt))
          );
          setSuccess('Sides option updated successfully');
        } else {
          setSidesOptions((prev) => [...prev, saved]);
          setSuccess('Sides option created successfully');
        }
        setEditDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save sides option');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (option: SidesOption) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sides-options/${option.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const duplicated = await response.json();
        setSidesOptions((prev) => [...prev, duplicated]);
        setSuccess(`"${option.name}" duplicated successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to duplicate');
      }
    } catch (err) {
      setError('Failed to duplicate sides option');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (option: SidesOption) => {
    setDeletingOption(option);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOption) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sides-options/${deletingOption.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSidesOptions((prev) => prev.filter((opt) => opt.id !== deletingOption.id));
        setSuccess(`"${deletingOption.name}" deleted successfully`);
        setDeleteDialogOpen(false);
        setDeletingOption(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete');
      }
    } catch (err) {
      setError('Failed to delete sides option');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Sides Options</h1>
          <p className="text-muted-foreground">
            Manage print sides configuration options with pricing multipliers
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sides Option
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
          <CardTitle>All Sides Options</CardTitle>
          <CardDescription>
            Configure how customers can print on their products. Each option can have a different price multiplier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price Multiplier</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sidesOptions.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <GripVertical className="h-4 w-4 mr-1" />
                      {option.display_order}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{option.name}</div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{option.slug}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {option.description || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={parseFloat(option.price_multiplier) !== 1 ? 'default' : 'secondary'}>
                      {parseFloat(option.price_multiplier).toFixed(2)}x
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={option.is_active ? 'default' : 'secondary'}>
                      {option.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(option)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(option)}
                        disabled={saving}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(option)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sidesOptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sides options configured. Click &quot;Add Sides Option&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Edit Sides Option' : 'Create Sides Option'}
            </DialogTitle>
            <DialogDescription>
              {editingOption
                ? 'Update the sides option details and pricing.'
                : 'Create a new sides option for customers to choose from.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Same Image Both Sides"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={editForm.slug}
                onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., same-both-sides"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this option"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_multiplier">Price Multiplier</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="price_multiplier"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10"
                  value={editForm.price_multiplier}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, price_multiplier: e.target.value }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">x base price</span>
              </div>
              <p className="text-xs text-muted-foreground">
                1.0 = no change, 1.5 = 50% more, 0.8 = 20% less
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={editForm.display_order}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))
                }
                className="w-24"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingOption ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sides Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingOption?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>How Price Multipliers Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm bg-muted p-4 rounded-lg">
            <div>Final Price = Base Price x <span className="text-blue-600 font-bold">Sides Multiplier</span></div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p><strong>Examples:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Same Image Both Sides: 1.0x (no extra charge)</li>
              <li>Different Image Both Sides: 1.5x (50% more for separate designs)</li>
              <li>Front Only / Blank Back: 0.8x (20% less, single side printing)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
