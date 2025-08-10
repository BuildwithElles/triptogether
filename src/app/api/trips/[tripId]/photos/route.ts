/**
 * API routes for trip photos
 * Handles CRUD operations for photo management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadTripPhoto } from '@/lib/utils/storage';
import { STORAGE_BUCKETS } from '@/lib/utils/constants';
import { Photo, PhotoInsert } from '@/lib/types/database';

interface RouteParams {
  params: {
    tripId: string;
  };
}

/**
 * GET /api/trips/[tripId]/photos
 * Retrieve photos for a trip with optional album filtering
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { tripId } = params;
    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');

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

    // Build query
    let query = supabase
      .from('photos')
      .select(`
        *,
        uploader:uploaded_by (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    // Apply album filter if provided
    if (album) {
      query = query.eq('album_name', album);
    }

    const { data: photos, error: photosError } = await query;

    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    // Transform data to include uploader name
    const photosWithUploader = photos.map((photo: any) => ({
      ...photo,
      uploader_name: photo.uploader?.raw_user_meta_data?.full_name || 
                     photo.uploader?.raw_user_meta_data?.name ||
                     photo.uploader?.email?.split('@')[0],
      uploader_email: photo.uploader?.email,
      uploader: undefined, // Remove nested uploader object
    }));

    return NextResponse.json(photosWithUploader);
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips/[tripId]/photos
 * Upload a new photo to the trip
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { tripId } = params;

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const albumName = formData.get('album_name') as string | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const locationName = formData.get('location_name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to storage
    const uploadResult = await uploadTripPhoto(file, tripId, user.id);
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    // Extract file metadata
    const fileSize = file.size;
    const mimeType = file.type;
    
    // Create photo record in database
    const photoData: PhotoInsert = {
      trip_id: tripId,
      uploaded_by: user.id,
      title: title || null,
      description: description || null,
      file_name: file.name,
      file_path: uploadResult.fileUrl!,
      file_size: fileSize,
      mime_type: mimeType,
      album_name: albumName || null,
      location_name: locationName || null,
      is_public: true, // Default to public within trip
    };

    const { data: photo, error: insertError } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting photo record:', insertError);
      return NextResponse.json({ error: 'Failed to save photo metadata' }, { status: 500 });
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
