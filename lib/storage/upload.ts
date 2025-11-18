import { minioClient, bucketName, ensureBucketExists } from './index';
import { nanoid } from 'nanoid';
import path from 'path';

export interface UploadResult {
  filename: string;
  originalFilename: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export async function uploadFile(file: File, userId: string): Promise<UploadResult> {
  await ensureBucketExists();

  const fileExtension = path.extname(file.name);
  const filename = `${nanoid()}${fileExtension}`;
  const storagePath = `uploads/${userId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(bucketName, storagePath, buffer, file.size, {
    'Content-Type': file.type,
  });

  // Generate URL (for internal use)
  const url = await minioClient.presignedGetObject(
    bucketName,
    storagePath,
    24 * 60 * 60 // 24 hours
  );

  return {
    filename,
    originalFilename: file.name,
    storagePath,
    fileSize: file.size,
    mimeType: file.type,
    url,
  };
}

export async function getFileUrl(storagePath: string, expirySeconds = 3600): Promise<string> {
  await ensureBucketExists();
  return await minioClient.presignedGetObject(bucketName, storagePath, expirySeconds);
}

export async function deleteFile(storagePath: string): Promise<void> {
  await ensureBucketExists();
  await minioClient.removeObject(bucketName, storagePath);
}
