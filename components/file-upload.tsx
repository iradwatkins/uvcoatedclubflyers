'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSizeMB = 100,
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png', '.ai', '.psd', '.eps'],
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [files]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    [files]
  );

  const handleFiles = async (newFiles: File[]) => {
    setUploadError(null);

    // Check max files
    if (files.length + newFiles.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and upload files
    const validFiles: File[] = [];

    for (const file of newFiles) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      // Check file format
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(extension)) {
        setUploadError(
          `File ${file.name} format not supported. Accepted: ${acceptedFormats.join(', ')}`
        );
        continue;
      }

      validFiles.push(file);
    }

    // Upload files
    for (const file of validFiles) {
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        url: '',
        status: 'uploading',
      };

      setFiles((prev) => [...prev, uploadedFile]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.status === 'uploading'
              ? { ...f, url: data.url, status: 'success' }
              : f
          )
        );
      } catch (error) {
        console.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.status === 'uploading'
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
      }
    }

    // Notify parent
    const successfulFiles = files.filter((f) => f.status === 'success');
    if (onFilesUploaded && successfulFiles.length > 0) {
      onFilesUploaded(successfulFiles);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Design Files</CardTitle>
        <CardDescription>
          Upload your print-ready files. Accepted formats: {acceptedFormats.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          className={`relative rounded-[10px] border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-medium">Drag and drop files here, or click to browse</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Max {maxFiles} files, up to {maxSizeMB}MB each
          </p>
        </div>

        {/* Error */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Uploaded Files</h3>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-[10px] border p-3"
              >
                <div className="flex items-center gap-3">
                  {file.status === 'uploading' && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {file.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {file.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}

                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                      {file.status === 'error' && file.error && (
                        <span className="ml-2 text-destructive">{file.error}</span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.name)}
                  disabled={file.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
