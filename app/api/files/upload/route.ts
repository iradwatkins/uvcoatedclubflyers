import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Allow both authenticated and guest uploads
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - expanded list for design files
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'application/pdf',
      'image/vnd.adobe.photoshop',
      'application/postscript',
      'application/illustrator',
      'application/x-photoshop',
      'application/octet-stream', // For .ai, .eps, .psd files
    ];

    // Also check by extension for files browsers report as octet-stream
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'pdf', 'ai', 'eps', 'psd'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'designs');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database (user_id can be NULL for guest uploads)
    const result = await prisma.$queryRaw`
      INSERT INTO design_files (
        user_id, filename, original_filename, file_size,
        mime_type, storage_path, created_at, updated_at
      ) VALUES (
        ${userId},
        ${filename},
        ${file.name},
        ${file.size},
        ${file.type},
        ${`/uploads/designs/${filename}`},
        NOW(),
        NOW()
      )
      RETURNING id
    ` as { id: number }[];

    const fileId = result[0]?.id;

    return NextResponse.json({
      success: true,
      id: fileId,
      filename,
      originalFilename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
