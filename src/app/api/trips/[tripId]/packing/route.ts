import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for packing item creation
const createPackingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long'),
  category: z.enum(['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'accessories', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().max(500, 'Notes too long').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

// Validation schema for packing item updates
const updatePackingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long').optional(),
  category: z.enum(['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'accessories', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  is_packed: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get packing items for the current user and trip
    const { data: packingItems, error: packingError } = await supabase
      .from('packing_items')
      .select(`
        id,
        name,
        category,
        priority,
        quantity,
        is_packed,
        notes,
        created_at,
        updated_at
      `)
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (packingError) {
      console.error('Error fetching packing items:', packingError)
      return NextResponse.json({ error: 'Failed to fetch packing items' }, { status: 500 })
    }

    return NextResponse.json({ 
      items: packingItems || [],
      stats: {
        total: packingItems?.length || 0,
        packed: packingItems?.filter((item: any) => item.is_packed).length || 0,
        unpacked: packingItems?.filter((item: any) => !item.is_packed).length || 0,
        completion: packingItems?.length > 0 
          ? Math.round((packingItems.filter((item: any) => item.is_packed).length / packingItems.length) * 100)
          : 0
      }
    })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/packing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPackingItemSchema.parse(body)

    // Create packing item
    const { data: packingItem, error: createError } = await supabase
      .from('packing_items')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        name: validatedData.name,
        category: validatedData.category,
        priority: validatedData.priority,
        quantity: validatedData.quantity,
        notes: validatedData.notes || null,
        is_packed: false,
      })
      .select(`
        id,
        name,
        category,
        priority,
        quantity,
        is_packed,
        notes,
        created_at,
        updated_at
      `)
      .single()

    if (createError) {
      console.error('Error creating packing item:', createError)
      return NextResponse.json({ error: 'Failed to create packing item' }, { status: 500 })
    }

    return NextResponse.json({ item: packingItem }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error in POST /api/trips/[tripId]/packing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { itemId, ...updateData } = body
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const validatedData = updatePackingItemSchema.parse(updateData)

    // Update packing item (user can only update their own items)
    const { data: packingItem, error: updateError } = await supabase
      .from('packing_items')
      .update(validatedData)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .select(`
        id,
        name,
        category,
        priority,
        quantity,
        is_packed,
        notes,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating packing item:', updateError)
      return NextResponse.json({ error: 'Failed to update packing item' }, { status: 500 })
    }

    if (!packingItem) {
      return NextResponse.json({ error: 'Packing item not found' }, { status: 404 })
    }

    return NextResponse.json({ item: packingItem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/trips/[tripId]/packing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete packing item (user can only delete their own items)
    const { error: deleteError } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting packing item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete packing item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/packing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
