import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for join request
const joinTripSchema = z.object({
  action: z.literal('join').optional(),
});

// Type definitions for API responses
interface InvitePreviewData {
  success: true;
  invite: {
    id: string;
    token: string;
    max_uses: number;
    current_uses: number;
    expires_at: string;
    is_active: boolean;
    email?: string;
  };
  trip: {
    id: string;
    title: string;
    description?: string;
    destination: string;
    start_date: string;
    end_date: string;
    status: string;
    member_count: number;
    created_by: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
}

interface JoinSuccessResponse {
  success: true;
  message: string;
  trip: {
    id: string;
    title: string;
  };
  redirect_url: string;
}

type APIResponse = InvitePreviewData | ErrorResponse | JoinSuccessResponse;

/**
 * GET /api/invite/[token] - Validate invite token and return trip preview
 * Public endpoint for invite preview (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse<APIResponse>> {
  try {
    const { token } = params;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid Token',
        message: 'Invite token is required and must be valid.',
        code: 'INVALID_TOKEN'
      }, { status: 400 });
    }

    // Create server client without authentication for public access
    const supabase = createClient();

    // Validate invite token and get trip information
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select(`
        id,
        token,
        max_uses,
        current_uses,
        expires_at,
        is_active,
        email,
        trip_id,
        trips!inner (
          id,
          title,
          description,
          destination,
          start_date,
          end_date,
          status,
          created_by
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Invite',
        message: 'This invite link is not valid or has been deactivated.',
        code: 'INVITE_NOT_FOUND'
      }, { status: 404 });
    }

    // Get trip creator information separately (skip for now as auth.users may not be accessible)
    // const { data: creator } = await supabase
    //   .from('auth.users')
    //   .select('id, raw_user_meta_data')
    //   .eq('id', (invite.trips as any).created_by)
    //   .single();

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return NextResponse.json({
        success: false,
        error: 'Expired Invite',
        message: 'This invite link has expired and cannot be used.',
        code: 'INVITE_EXPIRED'
      }, { status: 410 });
    }

    // Check if invite has reached usage limit
    if (invite.current_uses >= invite.max_uses) {
      return NextResponse.json({
        success: false,
        error: 'Invite Limit Reached',
        message: 'This invite link has reached its maximum usage limit.',
        code: 'INVITE_USED_UP'
      }, { status: 410 });
    }

    // Get member count for the trip
    const { count: memberCount } = await supabase
      .from('trip_users')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', invite.trip_id)
      .eq('is_active', true);

    // Extract trip data
    const trip = invite.trips as any; // Type assertion since it's a single object, not array
    if (!trip) {
      return NextResponse.json({
        success: false,
        error: 'Trip Not Found',
        message: 'The trip associated with this invite no longer exists.',
        code: 'TRIP_NOT_FOUND'
      }, { status: 404 });
    }

    // Format response data
    const responseData: InvitePreviewData = {
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        max_uses: invite.max_uses,
        current_uses: invite.current_uses,
        expires_at: invite.expires_at,
        is_active: invite.is_active,
        email: invite.email || undefined,
      },
      trip: {
        id: trip.id,
        title: trip.title,
        description: trip.description || undefined,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: trip.status,
        member_count: memberCount || 0,
        created_by: {
          id: trip.created_by,
          name: undefined, // TODO: Add creator name lookup
          email: 'Trip Organizer',
        },
      },
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Invite preview error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred while processing the invite.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * POST /api/invite/[token] - Join trip using invite token
 * Requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse<APIResponse>> {
  try {
    const { token } = params;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid Token',
        message: 'Invite token is required and must be valid.',
        code: 'INVALID_TOKEN'
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const validation = joinTripSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Request',
        message: 'Request body is invalid.',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Create authenticated server client
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication Required',
        message: 'You must be logged in to join a trip.',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // First, validate the invite token (similar to GET but in transaction)
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select(`
        id,
        token,
        max_uses,
        current_uses,
        expires_at,
        is_active,
        email,
        trip_id,
        trips (
          id,
          title,
          max_members
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Invite',
        message: 'This invite link is not valid or has been deactivated.',
        code: 'INVITE_NOT_FOUND'
      }, { status: 404 });
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < now) {
      return NextResponse.json({
        success: false,
        error: 'Expired Invite',
        message: 'This invite link has expired and cannot be used.',
        code: 'INVITE_EXPIRED'
      }, { status: 410 });
    }

    // Check if invite has reached usage limit
    if (invite.current_uses >= invite.max_uses) {
      return NextResponse.json({
        success: false,
        error: 'Invite Limit Reached',
        message: 'This invite link has reached its maximum usage limit.',
        code: 'INVITE_USED_UP'
      }, { status: 410 });
    }

    // Check if user is already a member of the trip
    const { data: existingMembership } = await supabase
      .from('trip_users')
      .select('id, is_active')
      .eq('trip_id', invite.trip_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership?.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Already Member',
        message: 'You are already a member of this trip.',
        code: 'ALREADY_MEMBER'
      }, { status: 409 });
    }

    // Check trip member limit
    const { count: currentMemberCount } = await supabase
      .from('trip_users')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', invite.trip_id)
      .eq('is_active', true);

    const trip = invite.trips as any; // Type assertion since it's a single object, not array
    if (!trip) {
      return NextResponse.json({
        success: false,
        error: 'Trip Not Found',
        message: 'The trip associated with this invite no longer exists.',
        code: 'TRIP_NOT_FOUND'
      }, { status: 404 });
    }

    if (trip.max_members && currentMemberCount && currentMemberCount >= trip.max_members) {
      return NextResponse.json({
        success: false,
        error: 'Trip Full',
        message: 'This trip has reached its maximum member limit.',
        code: 'TRIP_FULL'
      }, { status: 409 });
    }

    // Check email restriction if set
    if (invite.email && invite.email !== user.email) {
      return NextResponse.json({
        success: false,
        error: 'Email Restriction',
        message: 'This invite is restricted to a specific email address.',
        code: 'EMAIL_MISMATCH'
      }, { status: 403 });
    }

    // Join the trip: Use individual operations with error handling
    try {
      // Add user to trip as guest
      const { error: memberError } = await supabase
        .from('trip_users')
        .insert({
          trip_id: invite.trip_id,
          user_id: user.id,
          role: 'guest',
          is_active: true,
          joined_at: new Date().toISOString(),
          invitation_accepted_at: new Date().toISOString()
        });

      if (memberError) {
        // Handle specific database errors
        if (memberError.code === '23505') { // Unique constraint violation
          return NextResponse.json({
            success: false,
            error: 'Already Member',
            message: 'You are already a member of this trip.',
            code: 'ALREADY_MEMBER'
          }, { status: 409 });
        }
        throw memberError;
      }

      // Update invite usage count
      const { error: updateError } = await supabase
        .from('invite_tokens')
        .update({
          current_uses: invite.current_uses + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Update invite usage error:', updateError);
        // Note: Member was added successfully, but invite tracking failed
        // This is not critical for the user experience
      }

    } catch (error) {
      console.error('Join trip error:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Join Failed',
        message: 'Failed to join trip. Please try again.',
        code: 'JOIN_ERROR'
      }, { status: 500 });
    }

    // Success response
    const response: JoinSuccessResponse = {
      success: true,
      message: `Successfully joined "${trip.title}"!`,
      trip: {
        id: trip.id,
        title: trip.title,
      },
      redirect_url: `/trips/${trip.id}`,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Join trip error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred while joining the trip.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
