/**
 * Individual Outfit API Routes
 * Handles operations for specific outfit items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OutfitItemUpdate } from '@/lib/types/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string; outfitId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, outfitId } = params;
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

    // Check if outfit exists and user has permission to modify it
    const { data: existingOutfit, error: outfitError } = await supabase
      .from('outfit_items')
      .select('user_id, trip_id')
      .eq('id', outfitId)
      .eq('trip_id', tripId)
      .single();

    if (outfitError || !existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    // Only the outfit creator or trip admin can modify the outfit
    if (existingOutfit.user_id !== user.id && membership.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: OutfitItemUpdate = {};
    
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: 'Outfit name cannot be empty' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    
    if (body.occasion !== undefined) {
      updateData.occasion = body.occasion;
    }
    
    if (body.weather !== undefined) {
      updateData.weather = body.weather?.trim() || null;
    }
    
    if (body.date_planned !== undefined) {
      updateData.date_planned = body.date_planned || null;
    }
    
    if (body.clothing_items !== undefined) {
      updateData.clothing_items = body.clothing_items;
    }
    
    if (body.image_url !== undefined) {
      updateData.image_url = body.image_url?.trim() || null;
    }
    
    if (body.is_worn !== undefined) {
      updateData.is_worn = body.is_worn;
    }
    
    if (body.is_favorite !== undefined) {
      updateData.is_favorite = body.is_favorite;
    }

    // Update outfit
    const { data: outfit, error } = await supabase
      .from('outfit_items')
      .update(updateData)
      .eq('id', outfitId)
      .eq('trip_id', tripId)
      .select(`
        *
      `)
      .single();

    if (error || !outfit) {
      console.error('Error updating outfit:', error);
      return NextResponse.json({ error: 'Failed to update outfit' }, { status: 500 });
    }

    // Transform data to include user information
    const transformedOutfit = {
      ...outfit,
      user_name: null,
      user_email: null
    };

    return NextResponse.json({ outfit: transformedOutfit });

  } catch (error) {
    console.error('Outfit PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string; outfitId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, outfitId } = params;

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

    // Check if outfit exists and user has permission to delete it
    const { data: existingOutfit, error: outfitError } = await supabase
      .from('outfit_items')
      .select('user_id, trip_id')
      .eq('id', outfitId)
      .eq('trip_id', tripId)
      .single();

    if (outfitError || !existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    // Only the outfit creator or trip admin can delete the outfit
    if (existingOutfit.user_id !== user.id && membership.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete outfit
    const { error } = await supabase
      .from('outfit_items')
      .delete()
      .eq('id', outfitId)
      .eq('trip_id', tripId);

    if (error) {
      console.error('Error deleting outfit:', error);
      return NextResponse.json({ error: 'Failed to delete outfit' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Outfit deleted successfully' });

  } catch (error) {
    console.error('Outfit DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
