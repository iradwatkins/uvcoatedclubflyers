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
import { Loader2, AlertTriangle } from 'lucide-react';

interface AddonDeleteDialogProps {
  addonId: number;
  addonName: string;
  usageCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddonDeleteDialog({
  addonId,
  addonName,
  usageCount = 0,
  open,
  onOpenChange,
}: AddonDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/addons/${addonId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if addon is in use
        if (data.inUse) {
          setError(data.message || 'This addon is currently in use and cannot be deleted.');
          return;
        }

        throw new Error(data.error || 'Failed to delete addon');
      }

      // Success - redirect to list
      onOpenChange(false);
      router.push('/admin/addons');
      router.refresh();
    } catch (err: any) {
      console.error('Delete addon error:', err);
      setError(err.message || 'Failed to delete addon. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = usageCount === 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${canDelete ? 'text-yellow-500' : 'text-red-500'}`} />
            {canDelete ? 'Delete Add-On?' : 'Cannot Delete Add-On'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Are you sure you want to delete <strong>{addonName}</strong>? This action cannot be undone.
              </>
            ) : (
              <>
                The addon <strong>{addonName}</strong> cannot be deleted because it is currently assigned to{' '}
                <strong>{usageCount} product(s)</strong>.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!canDelete && (
          <Alert variant="destructive">
            <AlertDescription>
              To delete this addon, you must first remove it from all products in the Product Add-Ons management section.
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Add-On'
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
