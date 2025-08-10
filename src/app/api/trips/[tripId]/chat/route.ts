import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  message_type: z.enum(['text', 'image', 'file']).default('text'),
  file_url: z.string().url().optional(),
  reply_to: z.string().uuid().optional(),
});

const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
});

// GET /api/trips/[tripId]/chat - Get messages for a trip
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a trip member
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied. You must be a trip member to view messages.' },
        { status: 403 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch messages with user information
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        user:user_id (
          id,
          email
        ),
        reply_to_message:reply_to (
          id,
          content,
          user:user_id (
            id,
            email
          )
        )
      `)
      .eq('trip_id', params.tripId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', params.tripId);

    if (countError) {
      console.error('Error getting message count:', countError);
    }

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    });

  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/chat - Create a new message
export async function POST(
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a trip member
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied. You must be a trip member to send messages.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const messageData = validationResult.data;

    // If replying to a message, verify it exists and belongs to this trip
    if (messageData.reply_to) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageData.reply_to)
        .eq('trip_id', params.tripId)
        .single();

      if (replyError || !replyMessage) {
        return NextResponse.json(
          { error: 'Reply message not found' },
          { status: 400 }
        );
      }
    }

    // Create the message
    const { data: newMessage, error: createError } = await supabase
      .from('messages')
      .insert({
        trip_id: params.tripId,
        user_id: user.id,
        content: messageData.content,
        message_type: messageData.message_type,
        file_url: messageData.file_url,
        reply_to: messageData.reply_to,
      })
      .select(`
        *,
        user:user_id (
          id,
          email
        ),
        reply_to_message:reply_to (
          id,
          content,
          user:user_id (
            id,
            email
          )
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating message:', createError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}