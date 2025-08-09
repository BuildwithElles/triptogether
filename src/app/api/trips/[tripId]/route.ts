import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/trips/[tripId] - Fetch specific trip with members
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tripId } = params;

    // Validate tripId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tripId)) {
      return NextResponse.json(
        { error: 'Invalid trip ID format' },
        { status: 400 }
      );
    }

    // First check if user is a member of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role, is_active')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch trip details with all members
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        trip_users!inner(
          id,
          user_id,
          role,
          joined_at,
          invitation_accepted_at,
          is_active,
          nickname
        )
      `)
      .eq('id', tripId)
      .eq('archived', false)
      .single();

    if (tripError || !trip) {
      console.error('Error fetching trip:', tripError);
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Note: We can't access user profiles directly from the API without admin access
    // For now, we'll return basic info and let the frontend handle user data
    const members = trip.trip_users
      .filter((tu: any) => tu.is_active)
      .map((tu: any) => ({
        id: tu.id,
        userId: tu.user_id,
        role: tu.role,
        joinedAt: tu.joined_at,
        invitationAcceptedAt: tu.invitation_accepted_at,
        nickname: tu.nickname,
        email: '', // Will need to be populated by frontend
        fullName: '', // Will need to be populated by frontend
        avatarUrl: null,
      }));

    // Format trip response
    const tripResponse = {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      status: trip.status,
      createdBy: trip.created_by,
      createdAt: trip.created_at,
      updatedAt: trip.updated_at,
      budgetTotal: trip.budget_total,
      maxMembers: trip.max_members,
      isPublic: trip.is_public,
      members,
      memberCount: members.length,
      userRole: membership.role,
    };

    return NextResponse.json({ trip: tripResponse });

  } catch (error) {
    console.error('Unexpected error in GET /api/trips/[tripId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[tripId] - Update trip details (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tripId } = params;

    // Check if user is admin of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const allowedFields = [
      'title', 'description', 'destination', 'start_date', 'end_date',
      'budget_total', 'max_members', 'is_public', 'status'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update trip
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trip:', updateError);
      return NextResponse.json(
        { error: 'Failed to update trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Trip updated successfully',
      trip: {
        id: updatedTrip.id,
        title: updatedTrip.title,
        description: updatedTrip.description,
        destination: updatedTrip.destination,
        startDate: updatedTrip.start_date,
        endDate: updatedTrip.end_date,
        status: updatedTrip.status,
        budgetTotal: updatedTrip.budget_total,
        maxMembers: updatedTrip.max_members,
        isPublic: updatedTrip.is_public,
        updatedAt: updatedTrip.updated_at,
      }
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/trips/[tripId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId] - Archive trip (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tripId } = params;

    // Check if user is admin of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Archive trip (soft delete)
    const { error: archiveError } = await supabase
      .from('trips')
      .update({ 
        archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId);

    if (archiveError) {
      console.error('Error archiving trip:', archiveError);
      return NextResponse.json(
        { error: 'Failed to archive trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Trip archived successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/trips/[tripId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
