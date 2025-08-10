/**
 * Outfits API Routes
 * Handles CRUD operations for trip outfits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OutfitItemInsert } from '@/lib/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = params;
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this trip' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('outfit_items')
      .select(`*`)
      .eq('trip_id', tripId)
      .order('date_planned', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Apply date filter if provided
    if (dateFilter) {
      query = query.eq('date_planned', dateFilter);
    }

    const { data: outfits, error } = await query;

    if (error) {
      console.error('Error fetching outfits:', error);
      return NextResponse.json({ error: 'Failed to fetch outfits' }, { status: 500 });
    }

    // Transform data to include user information
    const transformedOutfits = outfits?.map(outfit => ({
      ...outfit,
      user_name: null,
      user_email: null
    })) || [];

    return NextResponse.json(transformedOutfits);

  } catch (error) {
    console.error('Outfits GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = params;
    const body = await request.json();

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this trip' }, { status: 403 });
    }

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Outfit name is required' }, { status: 400 });
    }

    // Prepare outfit data
    const outfitData: OutfitItemInsert = {
      trip_id: tripId,
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      occasion: body.occasion || 'casual',
      weather: body.weather?.trim() || null,
      date_planned: body.date_planned || null,
      clothing_items: body.clothing_items || [],
      image_url: body.image_url?.trim() || null,
      is_worn: false,
      is_favorite: false
    };

    // Insert outfit
    const { data: outfit, error } = await supabase
      .from('outfit_items')
      .insert(outfitData)
      .select(`*`)
      .single();

    if (error || !outfit) {
      console.error('Error creating outfit:', error);
      return NextResponse.json({ error: 'Failed to create outfit' }, { status: 500 });
    }

    // Transform data to include user information
    const transformedOutfit = {
      ...outfit,
      user_name: null,
      user_email: null
    };

    return NextResponse.json({ outfit: transformedOutfit }, { status: 201 });

  } catch (error) {
    console.error('Outfits POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
