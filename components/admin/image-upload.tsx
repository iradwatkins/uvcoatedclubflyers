'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label = 'Product Image',
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!accept.split(',').includes(file.type)) {
      setError('Invalid file type. Please upload a valid image.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Success
      onImageUploaded(data.imageUrl);
      setError(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!previewUrl) return;

    // If this is a MinIO URL (not a local preview), delete it
    if (previewUrl.startsWith('http')) {
      try {
        setIsUploading(true);
        const response = await fetch('/api/admin/products/upload-image', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: previewUrl }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete image');
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        setError(err.message || 'Failed to delete image');
      } finally {
        setIsUploading(false);
      }
    }

    setPreviewUrl(null);
    if (onImageRemoved) {
      onImageRemoved();
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="image-upload">{label}</Label>

      {/* Hidden file input */}
      <Input
        id="image-upload"
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Preview area */}
      {previewUrl ? (
        <div className="relative border rounded-lg overflow-hidden bg-muted/50">
          <div className="relative aspect-video w-full">
            <Image
              src={previewUrl}
              alt="Product preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Remove button */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={isUploading}
            type="button"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        // Upload prompt
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}

            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP, or GIF (max {maxSizeMB}MB)
              </p>
            </div>

            <Button type="button" variant="secondary" size="sm" disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Recommended: 1200x800px or larger for best quality. Images will be stored in MinIO.
      </p>
    </div>
  );
}
