import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
const ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL;

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/**
 * Upload audio file to Cloudflare R2
 * @param {File} file - Audio file to upload
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{fileId: string, url: string}>} - File ID and public URL
 */
export const uploadAudioToR2 = async (file, userId) => {
  try {
    // Generate unique file ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileId = `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    console.log('[R2] Config check:', {
      accountId: ACCOUNT_ID ? ACCOUNT_ID.substring(0, 8) + '...' : 'MISSING',
      accessKeyId: ACCESS_KEY_ID ? ACCESS_KEY_ID.substring(0, 8) + '...' : 'MISSING',
      secretKey: SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      bucket: BUCKET_NAME || 'MISSING',
      publicUrl: PUBLIC_URL || 'MISSING'
    });
    console.log('[R2] Uploading to key:', fileId);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileId,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      // R2 uses bucket-level public access, not per-object ACL
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = `${PUBLIC_URL}/${fileId}`;
    console.log('[R2] Upload complete. Public URL:', publicUrl);

    return {
      fileId,
      url: publicUrl,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload audio to storage. Please try again.');
  }
};

/**
 * Delete audio file from Cloudflare R2
 * @param {string} fileId - File ID to delete
 */
export const deleteAudioFromR2 = async (fileId) => {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileId,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete audio from storage.');
  }
};
