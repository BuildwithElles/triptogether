import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for updating messages
const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
});

// PUT /api/trips/[tripId]/messages/[messageId] - Update a message
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string; messageId: string } }
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
        { error: 'Access denied. You must be a trip member to edit messages.' },
        { status: 403 }
      );
    }

    // Verify message exists and user owns it
    const { data: existingMessage, error: messageError } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', params.messageId)
      .eq('trip_id', params.tripId)
      .single();

    if (messageError || !existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (existingMessage.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.messageId)
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

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMessage);

  } catch (error) {
    console.error('Error in PUT /api/trips/[tripId]/messages/[messageId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/messages/[messageId] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string; messageId: string } }
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
        { error: 'Access denied. You must be a trip member to delete messages.' },
        { status: 403 }
      );
    }

    // Verify message exists and user owns it (or is admin)
    const { data: existingMessage, error: messageError } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', params.messageId)
      .eq('trip_id', params.tripId)
      .single();

    if (messageError || !existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Users can delete their own messages, admins can delete any message
    if (existingMessage.user_id !== user.id && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', params.messageId);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/messages/[messageId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


