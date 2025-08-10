/**
 * Custom hook for managing trip photo gallery
 * Provides functionality for uploading, viewing, and managing photos
 */

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { Photo, PhotoInsert } from '../types/database';
import { useAuth } from './useAuth';

interface UseGalleryOptions {
  tripId: string;
  album?: string;
}

interface PhotoWithUploader extends Photo {
  uploader_name?: string;
  uploader_email?: string;
}

interface UploadProgress {
  photoId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function useGallery({ tripId, album }: UseGalleryOptions) {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [albumFilter, setAlbumFilter] = useState<string | undefined>(album);

  // Construct API URL with optional album filter
  const apiUrl = `/api/trips/${tripId}/photos${albumFilter ? `?album=${encodeURIComponent(albumFilter)}` : ''}`;

  // Fetch photos
  const {
    data: photos = [],
    error,
    isLoading,
    mutate,
  } = useSWR<PhotoWithUploader[]>(apiUrl);

  // Set up realtime subscription for photos
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`photos-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'photos',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Revalidate data when any change occurs
          mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, mutate]);

  /**
   * Upload multiple photos
   */
  const uploadPhotos = useCallback(
    async (files: FileList, albumName?: string) => {
      if (!user) {
        throw new Error('Must be logged in to upload photos');
      }

      const uploadPromises = Array.from(files).map(async (file, index) => {
        const photoId = `upload-${Date.now()}-${index}`;
        
        // Add to progress tracking
        setUploadProgress(prev => [...prev, {
          photoId,
          progress: 0,
          status: 'uploading'
        }]);

        try {
          const formData = new FormData();
          formData.append('file', file);
          if (albumName) {
            formData.append('album_name', albumName);
          }

          // Update progress to processing
          setUploadProgress(prev => prev.map(p => 
            p.photoId === photoId 
              ? { ...p, progress: 50, status: 'processing' as const }
              : p
          ));

          const response = await fetch(`/api/trips/${tripId}/photos`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const result = await response.json();

          // Mark as complete
          setUploadProgress(prev => prev.map(p => 
            p.photoId === photoId 
              ? { ...p, progress: 100, status: 'complete' as const }
              : p
          ));

          return result;
        } catch (error) {
          // Mark as error
          setUploadProgress(prev => prev.map(p => 
            p.photoId === photoId 
              ? { 
                  ...p, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : p
          ));
          throw error;
        }
      });

      try {
        const results = await Promise.allSettled(uploadPromises);
        
        // Refresh photo list
        await mutate();
        
        // Clear completed uploads after delay
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(p => p.status !== 'complete'));
        }, 3000);

        return results;
      } catch (error) {
        console.error('Error uploading photos:', error);
        throw error;
      }
    },
    [tripId, user, mutate]
  );

  /**
   * Delete a photo
   */
  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!user) {
        throw new Error('Must be logged in to delete photos');
      }

      try {
        const response = await fetch(`/api/trips/${tripId}/photos/${photoId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Delete failed');
        }

        // Optimistically update the list
        await mutate();
      } catch (error) {
        console.error('Error deleting photo:', error);
        throw error;
      }
    },
    [tripId, user, mutate]
  );

  /**
   * Update photo metadata
   */
  const updatePhoto = useCallback(
    async (photoId: string, updates: Partial<PhotoInsert>) => {
      if (!user) {
        throw new Error('Must be logged in to update photos');
      }

      try {
        const response = await fetch(`/api/trips/${tripId}/photos/${photoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Update failed');
        }

        const updatedPhoto = await response.json();

        // Optimistically update the list
        await mutate();
        
        return updatedPhoto;
      } catch (error) {
        console.error('Error updating photo:', error);
        throw error;
      }
    },
    [tripId, user, mutate]
  );

  /**
   * Toggle photo selection
   */
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  }, []);

  /**
   * Clear photo selection
   */
  const clearSelection = useCallback(() => {
    setSelectedPhotos([]);
  }, []);

  /**
   * Delete selected photos
   */
  const deleteSelectedPhotos = useCallback(
    async () => {
      if (selectedPhotos.length === 0) return;

      try {
        await Promise.all(selectedPhotos.map(photoId => deletePhoto(photoId)));
        setSelectedPhotos([]);
      } catch (error) {
        console.error('Error deleting selected photos:', error);
        throw error;
      }
    },
    [selectedPhotos, deletePhoto]
  );

  /**
   * Get unique albums from photos
   */
  const albums = photos
    .map(photo => photo.album_name)
    .filter((album, index, arr): album is string => {
      return album !== null && album !== undefined && arr.indexOf(album) === index;
    })
    .sort();

  /**
   * Set cover photo for trip
   */
  const setCoverPhoto = useCallback(
    async (photoId: string) => {
      try {
        // First, remove cover photo status from all photos
        const currentCoverPhoto = photos.find(p => p.is_cover_photo);
        if (currentCoverPhoto) {
          await updatePhoto(currentCoverPhoto.id, { is_cover_photo: false });
        }

        // Then set the new cover photo
        await updatePhoto(photoId, { is_cover_photo: true });
      } catch (error) {
        console.error('Error setting cover photo:', error);
        throw error;
      }
    },
    [photos, updatePhoto]
  );

  return {
    // Data
    photos,
    albums,
    selectedPhotos,
    uploadProgress,
    albumFilter,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    uploadPhotos,
    deletePhoto,
    updatePhoto,
    setCoverPhoto,
    togglePhotoSelection,
    clearSelection,
    deleteSelectedPhotos,
    setAlbumFilter,
    
    // Utilities
    refetch: mutate,
  };
}
