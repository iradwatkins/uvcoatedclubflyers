'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

interface FileUploaderProps {
  userId: string;
}

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'image/vnd.adobe.photoshop',
  'application/postscript',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUploader({ userId }: FileUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`${file.name}: File type not supported`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}: File size exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const fileStates: FileUploadState[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...fileStates]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileState: FileUploadState, index: number) => {
    const formData = new FormData();
    formData.append('file', fileState.file);
    formData.append('userId', userId);

    try {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
      );

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'success' as const, progress: 100, id: data.id } : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error' as const,
                error: 'Upload failed. Please try again.',
              }
            : f
        )
      );
    }
  };

  const uploadAll = async () => {
    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === 'pending');

    for (const { file, index } of pendingFiles) {
      await uploadFile(file, index);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard/files');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allUploaded = files.length > 0 && files.every((f) => f.status === 'success');
  const hasErrors = files.some((f) => f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>Drag and drop files here, or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground mb-4">
              PDF, PNG, JPG, AI, PSD (Max 50MB per file)
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.psd,.ai"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload">
              <Button asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Files to Upload ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((fileState, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                {getFileIcon(fileState.file)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fileState.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(fileState.file.size)}
                      </p>
                    </div>

                    {fileState.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {fileState.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}

                    {fileState.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {fileState.status === 'uploading' && <Progress value={50} className="h-2" />}

                  {fileState.status === 'success' && (
                    <p className="text-sm text-green-600">Upload complete</p>
                  )}

                  {fileState.status === 'error' && (
                    <p className="text-sm text-red-600">{fileState.error}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-4">
          {!allUploaded ? (
            <>
              <Button
                onClick={uploadAll}
                disabled={files.every((f) => f.status !== 'pending')}
                className="flex-1"
              >
                Upload All Files
              </Button>
              <Button variant="outline" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </>
          ) : (
            <Button onClick={handleFinish} className="flex-1">
              Done - View Files
            </Button>
          )}
        </div>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some files failed to upload. Please try again or remove the failed files.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
