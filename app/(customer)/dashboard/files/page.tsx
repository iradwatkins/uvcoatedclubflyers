import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilesTable } from '@/components/customer/files-table';
import { Upload, FolderOpen } from 'lucide-react';

export default async function FilesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's design files
  const files = await prisma.$queryRaw`
    SELECT * FROM design_files
    WHERE user_id = ${parseInt(session.user.id)}
    ORDER BY created_at DESC
  `;

  // Calculate storage used
  const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0);
  const storageUsedMB = (totalSize / (1024 * 1024)).toFixed(2);
  const storageLimit = 500; // 500 MB limit

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design Files</h1>
          <p className="text-muted-foreground">Upload and manage your artwork files</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/files/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Link>
        </Button>
      </div>

      {/* Storage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageUsedMB} MB</div>
            <p className="text-xs text-muted-foreground">of {storageLimit} MB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Space
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(storageLimit - parseFloat(storageUsedMB)).toFixed(2)} MB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Upload your design files to get started. Supported formats: PDF, PNG, JPG, AI, PSD
            </p>
            <Button asChild>
              <Link href="/dashboard/files/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First File
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <FilesTable files={files} />
      )}
    </div>
  );
}
