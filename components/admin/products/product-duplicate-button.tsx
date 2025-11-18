'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';

interface ProductDuplicateButtonProps {
  productId: number;
  productName: string;
  trigger?: React.ReactNode;
}

export function ProductDuplicateButton({
  productId,
  productName,
  trigger,
}: ProductDuplicateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      setError(null);

      const response = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate product');
      }

      // Success - redirect to edit the new product
      setOpen(false);
      router.push(`/admin/products/${data.productId}/edit`);
      router.refresh();
    } catch (err: any) {
      console.error('Duplicate product error:', err);
      setError(err.message || 'Failed to duplicate product. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Create a copy of <strong>{productName}</strong>?
              <br />
              <br />
              The duplicate will be created as inactive/draft and you'll be redirected to edit it.
              All product settings, options, and add-ons will be copied.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDuplicating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDuplicate();
              }}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duplicating...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
