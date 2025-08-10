/**
 * API routes for individual photo operations
 * Handles update and delete operations for specific photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFile, extractFilePathFromUrl } from '@/lib/utils/storage';
import { STORAGE_BUCKETS } from '@/lib/utils/constants';
import { PhotoUpdate } from '@/lib/types/database';

interface RouteParams {
  params: {
    tripId: string;
    photoId: string;
  };
}

/**
 * PATCH /api/trips/[tripId]/photos/[photoId]
 * Update photo metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { tripId, photoId } = params;

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to trip
    const { data: tripUser, error: tripError } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Get existing photo
    const { data: existingPhoto, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .eq('trip_id', tripId)
      .single();

    if (fetchError || !existingPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Parse update data
    const updates: PhotoUpdate = await request.json();

    // Validate allowed updates
    const allowedFields: (keyof PhotoUpdate)[] = [
      'title',
      'description',
      'album_name',
      'location_name',
      'tags',
      'is_favorite',
      'is_cover_photo',
    ];

    const filteredUpdates: Partial<PhotoUpdate> = {};
    for (const field of allowedFields) {
      if (field in updates && updates[field] !== undefined) {
        (filteredUpdates as any)[field] = updates[field];
      }
    }

    // Handle cover photo logic
    if (updates.is_cover_photo === true) {
      // Remove cover photo status from other photos in the trip
      await supabase
        .from('photos')
        .update({ is_cover_photo: false })
        .eq('trip_id', tripId)
        .eq('is_cover_photo', true);
    }

    // Update photo
    const { data: updatedPhoto, error: updateError } = await supabase
      .from('photos')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', photoId)
      .eq('trip_id', tripId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating photo:', updateError);
      return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
    }

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]/photos/[photoId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trips/[tripId]/photos/[photoId]
 * Delete a photo and its associated file
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { tripId, photoId } = params;

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to trip
    const { data: tripUser, error: tripError } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Get photo details before deletion
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .eq('trip_id', tripId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check if user can delete this photo (either uploader or trip admin)
    const canDelete = photo.uploaded_by === user.id || tripUser.role === 'admin';
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
      .eq('trip_id', tripId);

    if (deleteError) {
      console.error('Error deleting photo from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }

    // Extract file path from URL and delete from storage
    const filePath = extractFilePathFromUrl(photo.file_path, STORAGE_BUCKETS.tripPhotos);
    if (filePath) {
      const storageResult = await deleteFile(STORAGE_BUCKETS.tripPhotos, filePath);
      if (!storageResult.success) {
        console.warn('Failed to delete file from storage:', storageResult.error);
        // Don't fail the request if storage deletion fails - the DB record is already gone
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/photos/[photoId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
