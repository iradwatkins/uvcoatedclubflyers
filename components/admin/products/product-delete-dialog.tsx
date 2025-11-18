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
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface ProductDeleteDialogProps {
  productId: number;
  productName: string;
  orderCount: number;
  trigger?: React.ReactNode;
}

export function ProductDeleteDialog({
  productId,
  productName,
  orderCount,
  trigger,
}: ProductDeleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = orderCount === 0;

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.hasOrders) {
          setError(`Cannot delete this product. It has ${data.orderCount} existing order(s). Consider archiving it instead.`);
          return;
        }

        throw new Error(data.error || 'Failed to delete product');
      }

      // Success
      setOpen(false);
      router.refresh();

      // Show toast (if you have toast system)
      if (typeof window !== 'undefined') {
        console.log('Product deleted successfully');
      }
    } catch (err: any) {
      console.error('Delete product error:', err);
      setError(err.message || 'Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${canDelete ? 'text-yellow-500' : 'text-red-500'}`} />
              {canDelete ? 'Delete Product?' : 'Cannot Delete Product'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete ? (
                <>
                  Are you sure you want to delete <strong>{productName}</strong>?
                  <br />
                  This action cannot be undone.
                </>
              ) : (
                <>
                  The product <strong>{productName}</strong> cannot be deleted because it has{' '}
                  <strong>{orderCount} existing order{orderCount !== 1 ? 's' : ''}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!canDelete && (
            <Alert variant="destructive">
              <AlertDescription>
                To delete this product, all existing orders using it must be removed first.
                Consider archiving the product instead by setting its status to "Archived" in the edit page.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Product'
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
