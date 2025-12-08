'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadDropzoneProps {
  onFilesSelected?: (files: File[]) => void;
  files?: File[]; // Controlled mode - parent manages files
  maxFiles?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export function FileUploadDropzone({
  onFilesSelected,
  files: controlledFiles,
  maxFiles = 10,
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.eps', '.ai'],
  className,
}: FileUploadDropzoneProps) {
  // Use controlled files from parent if provided, otherwise use internal state
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const files = controlledFiles ?? internalFiles;
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles).slice(0, maxFiles - files.length);
      const updatedFiles = [...files, ...fileArray];

      // Update internal state only if not controlled
      if (controlledFiles === undefined) {
        setInternalFiles(updatedFiles);
      }
      onFilesSelected?.(updatedFiles);
    },
    [files, maxFiles, onFilesSelected, controlledFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);

    // Update internal state only if not controlled
    if (controlledFiles === undefined) {
      setInternalFiles(updatedFiles);
    }
    onFilesSelected?.(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          'hover:border-primary hover:bg-accent/50 cursor-pointer'
        )}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Supports: {acceptedFileTypes.join(', ')} (Max {maxFiles} files)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length} file{files.length > 1 ? 's' : ''} selected:
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
