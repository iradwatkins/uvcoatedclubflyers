import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Read file
    const filepath = join(process.cwd(), 'public', file.storage_path);
    const fileBuffer = await readFile(filepath);

    // Return file for inline viewing
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `inline; filename="${file.original_filename}"`,
      },
    });
  } catch (error) {
    console.error('File preview error:', error);
    return NextResponse.json({ error: 'Failed to preview file' }, { status: 500 });
  }
}
