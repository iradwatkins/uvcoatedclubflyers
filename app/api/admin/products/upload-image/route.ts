import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadProductImage, deleteProductImage } from '@/lib/minio';

/**
 * POST /api/admin/products/upload-image
 * Upload a product image to MinIO
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    const imageUrl = await uploadProductImage(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('[Upload Image] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to upload image',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/upload-image
 * Delete a product image from MinIO
 * Requires admin authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Delete from MinIO
    await deleteProductImage(imageUrl);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('[Delete Image] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to delete image',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
