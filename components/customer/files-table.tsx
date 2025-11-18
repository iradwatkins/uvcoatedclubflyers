'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image as ImageIcon, Download, Trash2, Eye } from 'lucide-react';
import { formatDate } from 'date-fns';

interface FilesTableProps {
  files: any[];
}

export function FilesTable({ files }: FilesTableProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      alert('Error deleting file');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Table Header - Desktop Only */}
          <div className="hidden grid-cols-6 gap-4 border-b pb-3 font-medium md:grid">
            <div className="col-span-2">File Name</div>
            <div>Type</div>
            <div>Size</div>
            <div>Uploaded</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Files */}
          {files.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-1 gap-4 border-b pb-4 last:border-0 md:grid-cols-6 md:items-center"
            >
              <div className="col-span-2">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.original_filename}</p>
                    {file.description && (
                      <p className="text-sm text-muted-foreground truncate">{file.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium md:hidden">Type</div>
                <Badge variant="secondary" className="text-xs">
                  {file.mime_type.split('/')[1].toUpperCase()}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium md:hidden">Size</div>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(file.file_size)}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium md:hidden">Uploaded</div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(new Date(file.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              <div className="flex gap-2 md:justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/api/files/${file.id}/preview`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
