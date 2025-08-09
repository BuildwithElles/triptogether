import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Trip creation validation schema
const createTripSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  destination: z.string().min(1, 'Destination is required').max(200, 'Destination must be 200 characters or less'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  budgetTotal: z.number().min(0, 'Budget must be positive').optional(),
  maxMembers: z.number().min(1, 'Must allow at least 1 member').max(100, 'Cannot exceed 100 members').optional(),
  isPublic: z.boolean().default(false),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

// GET /api/trips - Fetch user's trips
export async function GET(request: NextRequest) {
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

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('trips')
      .select(`
        *,
        trip_users!inner(
          id,
          role,
          joined_at,
          is_active
        )
      `)
      .eq('trip_users.user_id', user.id)
      .eq('trip_users.is_active', true)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    // Add status filter if provided
    if (status && ['planning', 'active', 'completed', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: trips, error: tripsError } = await query;

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      );
    }

    // Transform data to include member count and user role
    const transformedTrips = trips.map((trip: any) => ({
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
      memberCount: trip.trip_users?.length || 1,
      userRole: trip.trip_users?.[0]?.role || 'guest',
    }));

    return NextResponse.json({
      trips: transformedTrips,
      total: transformedTrips.length,
      offset,
      limit,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create new trip
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createTripSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid trip data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      destination,
      startDate,
      endDate,
      budgetTotal,
      maxMembers,
      isPublic
    } = validationResult.data;

    // Start a transaction to create trip and add user as admin
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget_total: budgetTotal,
        max_members: maxMembers,
        is_public: isPublic,
        created_by: user.id,
        status: 'planning'
      })
      .select()
      .single();

    if (tripError) {
      console.error('Error creating trip:', tripError);
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('trip_users')
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'admin',
        invitation_accepted_at: new Date().toISOString(),
        is_active: true
      });

    if (memberError) {
      console.error('Error adding user to trip:', memberError);
      // Try to clean up the trip if member creation failed
      await supabase.from('trips').delete().eq('id', trip.id);
      return NextResponse.json(
        { error: 'Failed to create trip membership' },
        { status: 500 }
      );
    }

    // Return the created trip with proper formatting
    const createdTrip = {
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
      memberCount: 1,
      userRole: 'admin',
    };

    return NextResponse.json(
      {
        message: 'Trip created successfully',
        trip: createdTrip
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
