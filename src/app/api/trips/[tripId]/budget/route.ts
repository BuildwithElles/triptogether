import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAuthUser } from '@/lib/auth/helpers';
import type { BudgetItemInsert, BudgetSplitInsert } from '@/lib/types/database';

// Budget validation schema
const budgetItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount is too large'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD, EUR)').default('USD'),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be under 50 characters'),
  paid_by: z.string().uuid('Invalid user ID').optional(),
  split_type: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  is_paid: z.boolean().default(false),
});

const budgetItemUpdateSchema = budgetItemSchema.partial();

// GET /api/trips/[tripId]/budget - Get all budget items for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    // Validate tripId format
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getCurrentAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check if user has access to this trip
    const { data: tripAccess, error: tripError } = await supabase
      .from('trip_users')
      .select('user_id, role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripAccess) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Get budget items for this trip (simplified query)
    const { data: budgetItems, error: budgetError } = await supabase
      .from('budget_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (budgetError) {
      console.error('Error fetching budget items:', budgetError);
      return NextResponse.json(
        { error: 'Failed to fetch budget items' },
        { status: 500 }
      );
    }

    // Calculate budget summary
    const totalBudget = budgetItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
    const paidAmount = budgetItems?.filter((item: any) => item.is_paid).reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
    const unpaidAmount = totalBudget - paidAmount;

    // Get trip members for split calculations
    const { data: tripMembers, error: membersError } = await supabase
      .from('trip_users')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('is_active', true);

    if (membersError) {
      console.error('Error fetching trip members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch trip members' },
        { status: 500 }
      );
    }

    const memberCount = tripMembers?.length || 1;
    const perPersonAmount = totalBudget / memberCount;

    return NextResponse.json({
      budget_items: budgetItems || [],
      summary: {
        total_budget: totalBudget,
        paid_amount: paidAmount,
        unpaid_amount: unpaidAmount,
        per_person_amount: perPersonAmount,
        member_count: memberCount,
        currency: budgetItems?.[0]?.currency || 'USD'
      },
      trip_members: tripMembers || []
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/trips/[tripId]/budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[tripId]/budget - Create a new budget item
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    // Validate tripId format
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getCurrentAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = budgetItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const supabase = createClient();

    // Check if user has access to this trip
    const { data: tripAccess, error: tripError } = await supabase
      .from('trip_users')
      .select('user_id, role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripAccess) {
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }

    // Get trip members for equal split calculation
    const { data: tripMembers, error: membersError } = await supabase
      .from('trip_users')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('is_active', true);

    if (membersError) {
      console.error('Error fetching trip members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch trip members' },
        { status: 500 }
      );
    }

    const memberCount = tripMembers?.length || 1;

    // Create budget item
    const budgetItemData: BudgetItemInsert = {
      trip_id: tripId,
      title: validatedData.title,
      description: validatedData.description || null,
      amount: validatedData.amount,
      currency: validatedData.currency,
      category: validatedData.category,
      paid_by: validatedData.paid_by || user.id,
      split_type: validatedData.split_type,
      is_paid: validatedData.is_paid,
      created_by: user.id,
    };

    const { data: budgetItem, error: budgetError } = await supabase
      .from('budget_items')
      .insert(budgetItemData)
      .select()
      .single();

    if (budgetError) {
      console.error('Error creating budget item:', budgetError);
      return NextResponse.json(
        { error: 'Failed to create budget item' },
        { status: 500 }
      );
    }

    // Create budget splits for equal split type
    if (validatedData.split_type === 'equal' && tripMembers) {
      const splitAmount = validatedData.amount / memberCount;
      const splitData: BudgetSplitInsert[] = tripMembers.map((member: any) => ({
        budget_item_id: budgetItem.id,
        user_id: member.user_id,
        amount: splitAmount,
        is_paid: false,
      }));

      const { error: splitsError } = await supabase
        .from('budget_splits')
        .insert(splitData);

      if (splitsError) {
        console.error('Error creating budget splits:', splitsError);
        // Don't fail the entire request for split creation errors
      }
    }

    return NextResponse.json(budgetItem, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/trips/[tripId]/budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[tripId]/budget/[itemId] - Update a budget item
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();

    if (!tripId || !itemId) {
      return NextResponse.json(
        { error: 'Invalid trip ID or item ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getCurrentAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = budgetItemUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if user has access to this trip and budget item
    const { data: budgetItem, error: itemError } = await supabase
      .from('budget_items')
      .select('id, trip_id')
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single();

    if (itemError || !budgetItem) {
      return NextResponse.json(
        { error: 'Budget item not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is a member of the trip
    const { data: tripAccess, error: tripError } = await supabase
      .from('trip_users')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripAccess) {
      return NextResponse.json(
        { error: 'Trip access denied' },
        { status: 403 }
      );
    }

    // Update budget item
    const { data: updatedItem, error: updateError } = await supabase
      .from('budget_items')
      .update(validationResult.data)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating budget item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update budget item' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('Unexpected error in PUT /api/trips/[tripId]/budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[tripId]/budget/[itemId] - Delete a budget item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();

    if (!tripId || !itemId) {
      return NextResponse.json(
        { error: 'Invalid trip ID or item ID' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getCurrentAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check if user has access to this trip and budget item
    const { data: budgetItem, error: itemError } = await supabase
      .from('budget_items')
      .select('id, trip_id')
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single();

    if (itemError || !budgetItem) {
      return NextResponse.json(
        { error: 'Budget item not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is a member of the trip
    const { data: tripAccess, error: tripError } = await supabase
      .from('trip_users')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (tripError || !tripAccess) {
      return NextResponse.json(
        { error: 'Trip access denied' },
        { status: 403 }
      );
    }

    // Delete budget splits first (cascade delete)
    const { error: splitsError } = await supabase
      .from('budget_splits')
      .delete()
      .eq('budget_item_id', itemId);

    if (splitsError) {
      console.error('Error deleting budget splits:', splitsError);
      // Continue with budget item deletion
    }

    // Delete budget item
    const { error: deleteError } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting budget item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete budget item' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Budget item deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in DELETE /api/trips/[tripId]/budget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
