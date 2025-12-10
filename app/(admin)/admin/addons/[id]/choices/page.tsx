import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { ChoiceForm } from '@/components/admin/choice-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Choice {
  id: number;
  add_on_id: number;
  value: string;
  label: string;
  description: string | null;
  price_type: string;
  base_price: string;
  per_unit_price: string;
  percentage: string;
  requires_file_upload: boolean;
  requires_sides_selection: boolean;
  sides_pricing: any;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
}

interface AddOn {
  id: number;
  name: string;
  slug: string;
  ui_component: string;
}

async function getAddOn(id: number): Promise<AddOn | null> {
  const result = await prisma.$queryRaw<AddOn[]>`
    SELECT id, name, slug, ui_component FROM add_ons WHERE id = ${id}
  `;
  return result[0] || null;
}

async function getChoices(addOnId: number): Promise<Choice[]> {
  const result = await prisma.$queryRaw<Choice[]>`
    SELECT * FROM add_on_choices
    WHERE add_on_id = ${addOnId}
    ORDER BY display_order, id
  `;
  return result;
}

function formatPrice(choice: Choice): string {
  const basePrice = parseFloat(choice.base_price || '0');
  const perUnit = parseFloat(choice.per_unit_price || '0');

  if (choice.requires_sides_selection && choice.sides_pricing) {
    const sides = typeof choice.sides_pricing === 'string'
      ? JSON.parse(choice.sides_pricing)
      : choice.sides_pricing;
    return `$${sides.one} / $${sides.two}`;
  }

  if (basePrice === 0 && perUnit === 0) {
    return 'FREE';
  }

  if (choice.price_type === 'flat') {
    return `$${basePrice.toFixed(2)}`;
  }

  if (choice.price_type === 'per_unit') {
    return `$${perUnit.toFixed(4)}/pc`;
  }

  if (choice.price_type === 'percentage') {
    return `${parseFloat(choice.percentage || '0')}%`;
  }

  if (basePrice > 0 && perUnit > 0) {
    return `$${basePrice.toFixed(2)} + $${perUnit.toFixed(4)}/pc`;
  }

  return basePrice > 0 ? `$${basePrice.toFixed(2)}` : 'Custom';
}

export default async function ChoicesPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const { id } = await params;
  const addOnId = parseInt(id);

  const addOn = await getAddOn(addOnId);
  if (!addOn) {
    notFound();
  }

  const choices = await getChoices(addOnId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/addons/${addOnId}/edit`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Manage Choices</h1>
            <p className="text-muted-foreground">
              Configure dropdown options for <strong>{addOn.name}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Add New Choice */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Choice</CardTitle>
          <CardDescription>Create a new option for the dropdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ChoiceForm addOnId={addOnId} />
        </CardContent>
      </Card>

      {/* Existing Choices */}
      <Card>
        <CardHeader>
          <CardTitle>Current Choices ({choices.length})</CardTitle>
          <CardDescription>Drag to reorder, click to edit</CardDescription>
        </CardHeader>
        <CardContent>
          {choices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No choices configured yet. Add your first choice above.
            </div>
          ) : (
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    choice.is_active ? 'bg-background' : 'bg-muted/50'
                  }`}
                >
                  <div className="cursor-grab text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{choice.label}</span>
                      {choice.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {!choice.is_active && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {choice.description || 'No description'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {choice.value}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatPrice(choice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {choice.requires_file_upload && 'File Upload'}
                      {choice.requires_sides_selection && 'Sides Selection'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/addons/${addOnId}/choices/${choice.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
