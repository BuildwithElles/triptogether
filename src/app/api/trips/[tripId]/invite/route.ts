import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { Database } from '@/lib/types/database';

// Request validation schema
const createInviteSchema = z.object({
  maxUses: z.number().min(1).max(100).default(10),
  expiresInDays: z.number().min(1).max(30).default(7),
  email: z.string().email().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createInviteSchema.parse(body);

    const { tripId } = params;

    // Verify user is admin of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripUserError || !tripUser || tripUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only trip admins can generate invite links.' },
        { status: 403 }
      );
    }

    // Generate unique invite token
    const token = nanoid(32); // 32 character random string

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays);

    // Create invite token in database
    const { data: inviteToken, error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        trip_id: tripId,
        created_by: user.id,
        email: validatedData.email || null,
        max_uses: validatedData.maxUses,
        current_uses: 0,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invite token:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invite token' },
        { status: 500 }
      );
    }

    // Return invite data with generated URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: inviteToken.id,
        token: inviteToken.token,
        url: inviteUrl,
        maxUses: inviteToken.max_uses,
        currentUses: inviteToken.current_uses,
        expiresAt: inviteToken.expires_at,
        email: inviteToken.email,
        isActive: inviteToken.is_active,
        createdAt: inviteToken.created_at,
      },
    });
  } catch (error) {
    console.error('Error in invite generation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId } = params;

    // Verify user is admin of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripUserError || !tripUser || tripUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only trip admins can view invite links.' },
        { status: 403 }
      );
    }

    // Get all active invite tokens for this trip
    const { data: inviteTokens, error: fetchError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching invite tokens:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch invite tokens' },
        { status: 500 }
      );
    }

    // Format invite tokens with URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const formattedInvites = inviteTokens.map((invite: any) => ({
      id: invite.id,
      token: invite.token,
      url: `${baseUrl}/invite/${invite.token}`,
      maxUses: invite.max_uses,
      currentUses: invite.current_uses,
      expiresAt: invite.expires_at,
      email: invite.email,
      isActive: invite.is_active,
      createdAt: invite.created_at,
    }));

    return NextResponse.json({
      success: true,
      invites: formattedInvites,
    });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      );
    }

    const { tripId } = params;

    // Verify user is admin of the trip
    const { data: tripUser, error: tripUserError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripUserError || !tripUser || tripUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only trip admins can delete invite links.' },
        { status: 403 }
      );
    }

    // Deactivate the invite token
    const { error: updateError } = await supabase
      .from('invite_tokens')
      .update({ is_active: false })
      .eq('id', inviteId)
      .eq('trip_id', tripId);

    if (updateError) {
      console.error('Error deactivating invite token:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate invite token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
