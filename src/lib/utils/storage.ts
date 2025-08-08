/**
 * Storage utility functions for Supabase file management
 * Handles uploads, downloads, and file management for TripTogether
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { STORAGE_BUCKETS } from './constants';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PHOTO: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024, // 2MB
  OUTFIT_IMAGE: 5 * 1024 * 1024, // 5MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  PHOTOS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'] as const,
} as const;

// Storage client instance
let storageClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get storage client instance
 */
export function getStorageClient() {
  if (!storageClient) {
    storageClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return storageClient;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxSize: number
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Generate unique file name with timestamp and random suffix
 */
export function generateFileName(originalName: string, userId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${userId}_${timestamp}_${randomSuffix}.${extension}`;
}

/**
 * Upload trip photo
 */
export async function uploadTripPhoto(
  file: File,
  tripId: string,
  userId: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_FILE_TYPES.PHOTOS, FILE_SIZE_LIMITS.PHOTO);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const client = getStorageClient();
    const fileName = generateFileName(file.name, userId);
    const filePath = `${tripId}/${fileName}`;

    // Upload file
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.tripPhotos)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(STORAGE_BUCKETS.tripPhotos)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_FILE_TYPES.IMAGES, FILE_SIZE_LIMITS.AVATAR);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const client = getStorageClient();
    const fileName = generateFileName(file.name, userId);
    const filePath = `${userId}/${fileName}`;

    // Upload file
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.userAvatars)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting for avatars
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(STORAGE_BUCKETS.userAvatars)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload outfit image
 */
export async function uploadOutfitImage(
  file: File,
  tripId: string,
  userId: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file, ALLOWED_FILE_TYPES.IMAGES, FILE_SIZE_LIMITS.OUTFIT_IMAGE);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const client = getStorageClient();
    const fileName = generateFileName(file.name, userId);
    const filePath = `${tripId}/${userId}/${fileName}`;

    // Upload file
    const { data, error } = await client.storage
      .from(STORAGE_BUCKETS.outfitImages)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(STORAGE_BUCKETS.outfitImages)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getStorageClient();

    const { error } = await client.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * List files in a bucket path
 */
export async function listFiles(
  bucket: string,
  path?: string,
  limit = 100
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const client = getStorageClient();

    const { data, error } = await client.storage
      .from(bucket)
      .list(path, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, files: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
    };
  }
}

/**
 * Get file download URL with expiration
 */
export async function getDownloadUrl(
  bucket: string,
  filePath: string,
  expiresInSeconds = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const client = getStorageClient();

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download URL generation failed',
    };
  }
}

/**
 * Helper function to extract file path from public URL
 */
export function extractFilePathFromUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      return null;
    }
    
    return pathParts.slice(bucketIndex + 1).join('/');
  } catch {
    return null;
  }
}

/**
 * Utility types for storage operations
 */
export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}
