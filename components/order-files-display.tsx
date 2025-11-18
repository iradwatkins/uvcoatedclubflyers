'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Image as ImageIcon, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileData {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
}

interface OrderFilesDisplayProps {
  fileIds: number[];
  className?: string;
  showDownload?: boolean; // Whether to show download buttons
  variant?: 'compact' | 'detailed'; // Display variant
}

export function OrderFilesDisplay({
  fileIds,
  className,
  showDownload = false,
  variant = 'compact'
}: OrderFilesDisplayProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileIds && fileIds.length > 0) {
      loadFiles();
    } else {
      setIsLoading(false);
    }
  }, [fileIds]);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch file metadata for each file ID
      const filePromises = fileIds.map(async (id) => {
        const response = await fetch(`/api/files/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to load file ${id}`);
        }
        const result = await response.json();
        return result.data;
      });

      const filesData = await Promise.all(filePromises);
      setFiles(filesData);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load file information');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-sm text-destructive', className)}>
        {error}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-sm font-medium text-muted-foreground">
          {files.length} file{files.length > 1 ? 's' : ''} attached
        </p>
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              {getFileIcon(file.mime_type)}
              <span className="truncate max-w-[150px]">{file.original_filename}</span>
              {showDownload && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDownload(file.id, file.original_filename)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">
        Uploaded Files ({files.length})
      </p>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(file.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.original_filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
              </div>
            </div>
            {showDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(file.id, file.original_filename)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
