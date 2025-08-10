import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for itinerary items
const itineraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripUserError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Get itinerary items for the trip
    const { data: items, error } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        created_by_user:auth.users!created_by(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('trip_id', params.tripId)
      .order('start_time', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching itinerary items:', error);
      return NextResponse.json({ error: 'Failed to fetch itinerary items' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripUserError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = itineraryItemSchema.parse(body);

    // Validate time order if both start and end times are provided
    if (validatedData.start_time && validatedData.end_time) {
      const startTime = new Date(validatedData.start_time);
      const endTime = new Date(validatedData.end_time);
      
      if (endTime <= startTime) {
        return NextResponse.json({ 
          error: 'End time must be after start time' 
        }, { status: 400 });
      }
    }

    // Create the itinerary item
    const { data: item, error } = await supabase
      .from('itinerary_items')
      .insert({
        trip_id: params.tripId,
        title: validatedData.title,
        description: validatedData.description || null,
        location: validatedData.location || null,
        start_time: validatedData.start_time || null,
        end_time: validatedData.end_time || null,
        category: validatedData.category,
        created_by: user.id,
      })
      .select(`
        *,
        created_by_user:auth.users!created_by(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .single();

    if (error) {
      console.error('Error creating itinerary item:', error);
      return NextResponse.json({ error: 'Failed to create itinerary item' }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error in POST /api/trips/[tripId]/itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripUserError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Validate the update data
    const validatedData = itineraryItemSchema.partial().parse(updateData);

    // Validate time order if both start and end times are provided
    if (validatedData.start_time && validatedData.end_time) {
      const startTime = new Date(validatedData.start_time);
      const endTime = new Date(validatedData.end_time);
      
      if (endTime <= startTime) {
        return NextResponse.json({ 
          error: 'End time must be after start time' 
        }, { status: 400 });
      }
    }

    // Update the itinerary item
    const { data: item, error } = await supabase
      .from('itinerary_items')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('trip_id', params.tripId)
      .select(`
        *,
        created_by_user:auth.users!created_by(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .single();

    if (error) {
      console.error('Error updating itinerary item:', error);
      return NextResponse.json({ error: 'Failed to update itinerary item' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error in PUT /api/trips/[tripId]/itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripUserError || !tripUser) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
    }

    // Get item ID from search params
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Delete the itinerary item
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', params.tripId);

    if (error) {
      console.error('Error deleting itinerary item:', error);
      return NextResponse.json({ error: 'Failed to delete itinerary item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
