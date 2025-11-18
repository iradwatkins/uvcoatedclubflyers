import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    // Fetch file metadata from database (using files table, not design_files)
    const files = await prisma.$queryRaw<any[]>`
      SELECT id, filename, original_filename, file_size, mime_type, storage_path, uploaded_at
      FROM files
      WHERE id = ${fileId}
    `;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: files[0],
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Failed to fetch file information' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get file info
    const files = await prisma.$queryRaw<any[]>`
      SELECT * FROM design_files
      WHERE id = ${parseInt(id)}
      AND user_id = ${parseInt(session.user.id)}
    `;

    const file = files[0];

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete physical file
    try {
      const filepath = join(process.cwd(), 'public', file.storage_path);
      await unlink(filepath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Continue even if physical file deletion fails
    }

    // Delete from database
    await prisma.$executeRaw`
      DELETE FROM design_files
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
