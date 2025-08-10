import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/trips/[tripId]/budget/[itemId] - Get specific budget item
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string; itemId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, itemId } = params;

    // Check if user is a member of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the budget item with related data
    const { data: budgetItem, error: budgetError } = await supabase
      .from('budget_items')
      .select(`
        *,
        paid_by_user:auth(id, raw_user_meta_data),
        created_by_user:auth(id, raw_user_meta_data),
        budget_splits(
          *,
          user:auth(id, raw_user_meta_data)
        )
      `)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single();

    if (budgetError || !budgetItem) {
      return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
    }

    return NextResponse.json(budgetItem);
  } catch (error) {
    console.error('Error fetching budget item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[tripId]/budget/[itemId] - Update budget item
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string; itemId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, itemId } = params;
    const updates = await request.json();

    // Check if user is a member of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the existing budget item to check ownership
    const { data: existingItem, error: existingError } = await supabase
      .from('budget_items')
      .select('created_by')
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single();

    if (existingError || !existingItem) {
      return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
    }

    // Check if user can edit (creator or admin)
    if (existingItem.created_by !== user.id && membership.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Validate update data
    const validUpdates: any = {};
    
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      validUpdates.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      validUpdates.description = updates.description?.trim() || null;
    }

    if (updates.amount !== undefined) {
      const amount = parseFloat(updates.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
      }
      validUpdates.amount = amount;
    }

    if (updates.currency !== undefined) {
      if (typeof updates.currency !== 'string' || updates.currency.length !== 3) {
        return NextResponse.json({ error: 'Currency must be 3 characters' }, { status: 400 });
      }
      validUpdates.currency = updates.currency.toUpperCase();
    }

    if (updates.category !== undefined) {
      if (typeof updates.category !== 'string' || updates.category.trim().length === 0) {
        return NextResponse.json({ error: 'Category is required' }, { status: 400 });
      }
      validUpdates.category = updates.category.trim();
    }

    if (updates.paid_by !== undefined) {
      validUpdates.paid_by = updates.paid_by || null;
    }

    if (updates.split_type !== undefined) {
      if (!['equal', 'custom', 'percentage'].includes(updates.split_type)) {
        return NextResponse.json({ error: 'Invalid split type' }, { status: 400 });
      }
      validUpdates.split_type = updates.split_type;
    }

    if (updates.is_paid !== undefined) {
      validUpdates.is_paid = Boolean(updates.is_paid);
    }

    validUpdates.updated_at = new Date().toISOString();

    // Update the budget item
    const { data: updatedItem, error: updateError } = await supabase
      .from('budget_items')
      .update(validUpdates)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .select(`
        *,
        paid_by_user:auth(id, raw_user_meta_data),
        created_by_user:auth(id, raw_user_meta_data),
        budget_splits(
          *,
          user:auth(id, raw_user_meta_data)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating budget item:', updateError);
      return NextResponse.json({ error: 'Failed to update budget item' }, { status: 500 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating budget item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/budget/[itemId] - Delete budget item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string; itemId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, itemId } = params;

    // Check if user is a member of this trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the existing budget item to check ownership
    const { data: existingItem, error: existingError } = await supabase
      .from('budget_items')
      .select('created_by')
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single();

    if (existingError || !existingItem) {
      return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
    }

    // Check if user can delete (creator or admin)
    if (existingItem.created_by !== user.id && membership.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete associated budget splits first
    const { error: splitsError } = await supabase
      .from('budget_splits')
      .delete()
      .eq('budget_item_id', itemId);

    if (splitsError) {
      console.error('Error deleting budget splits:', splitsError);
      return NextResponse.json({ error: 'Failed to delete budget splits' }, { status: 500 });
    }

    // Delete the budget item
    const { error: deleteError } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId);

    if (deleteError) {
      console.error('Error deleting budget item:', deleteError);
      return NextResponse.json({ error: 'Failed to delete budget item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
