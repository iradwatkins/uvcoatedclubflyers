import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9002'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'design-files';
const PRODUCT_IMAGES_BUCKET = 'product-images';

// Ensure bucket exists
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    await ensureBucket();

    const objectName = `${Date.now()}-${fileName}`;

    await minioClient.putObject(BUCKET_NAME, objectName, file, file.length, {
      'Content-Type': contentType,
    });

    // Generate presigned URL (valid for 7 days)
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 7 * 24 * 60 * 60);

    return url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFile(fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

export async function getFileUrl(fileName: string): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, fileName, 7 * 24 * 60 * 60);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

// ============================================================================
// PRODUCT IMAGES
// ============================================================================

/**
 * Ensure product images bucket exists with public read policy
 */
export async function ensureProductImagesBucket() {
  try {
    const exists = await minioClient.bucketExists(PRODUCT_IMAGES_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(PRODUCT_IMAGES_BUCKET, 'us-east-1');

      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${PRODUCT_IMAGES_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(PRODUCT_IMAGES_BUCKET, JSON.stringify(policy));
      console.log(`Product images bucket ${PRODUCT_IMAGES_BUCKET} created with public read access`);
    }
  } catch (error) {
    console.error('Error ensuring product images bucket exists:', error);
    throw error;
  }
}

/**
 * Upload a product image to MinIO
 * Returns a permanent public URL (not presigned)
 */
export async function uploadProductImage(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    await ensureProductImagesBucket();

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${timestamp}-${sanitizedFileName}`;

    // Upload the image
    await minioClient.putObject(PRODUCT_IMAGES_BUCKET, objectName, file, file.length, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    // Return permanent public URL
    const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${PRODUCT_IMAGES_BUCKET}/${objectName}`;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw new Error('Failed to upload product image');
  }
}

/**
 * Delete a product image from MinIO
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract object name from URL
    // URL format: http://localhost:9002/product-images/timestamp-filename.jpg
    const objectName = imageUrl.split('/').pop();
    if (!objectName) {
      throw new Error('Invalid image URL');
    }

    await minioClient.removeObject(PRODUCT_IMAGES_BUCKET, objectName);
    console.log(`Deleted product image: ${objectName}`);
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw new Error('Failed to delete product image');
  }
}

/**
 * List all product images
 */
export async function listProductImages(): Promise<string[]> {
  try {
    const stream = minioClient.listObjects(PRODUCT_IMAGES_BUCKET, '', true);
    const images: string[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          const url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${PRODUCT_IMAGES_BUCKET}/${obj.name}`;
          images.push(url);
        }
      });

      stream.on('error', (err) => {
        console.error('Error listing product images:', err);
        reject(err);
      });

      stream.on('end', () => {
        resolve(images);
      });
    });
  } catch (error) {
    console.error('Error listing product images:', error);
    throw new Error('Failed to list product images');
  }
}
