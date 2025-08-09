import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Create a Supabase client for server-side operations
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current user from the server with cookie management
 * Returns null if not authenticated
 */
export async function getCurrentAuthUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getCurrentAuthUser:', error)
    return null
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use in Server Components that require authentication
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const user = await getCurrentAuthUser()
  
  if (!user) {
    const loginUrl = redirectTo 
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginUrl)
  }
  
  return user
}

/**
 * Require admin role for a specific trip
 * Returns the user if they are an admin of the trip
 */
export async function requireTripAdmin(tripId: string): Promise<User> {
  const user = await requireAuth()
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: membership, error } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (error || !membership || membership.role !== 'admin') {
      redirect('/dashboard')
    }
    
    return user
  } catch (error) {
    console.error('Error checking trip admin status:', error)
    redirect('/dashboard')
  }
}

/**
 * Check if user is a member of a trip
 * Returns the user if they are a member of the trip
 */
export async function requireTripMember(tripId: string): Promise<User> {
  const user = await requireAuth()
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: membership, error } = await supabase
      .from('trip_users')
      .select('role, is_active')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()
    
    if (error || !membership || !membership.is_active) {
      redirect('/dashboard')
    }
    
    return user
  } catch (error) {
    console.error('Error checking trip membership:', error)
    redirect('/dashboard')
  }
}

/**
 * Get user's role in a trip
 * Returns null if user is not a member
 */
export async function getUserTripRole(tripId: string, userId: string): Promise<'admin' | 'guest' | null> {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: membership, error } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    if (error || !membership) {
      return null
    }
    
    return membership.role as 'admin' | 'guest'
  } catch (error) {
    console.error('Error getting user trip role:', error)
    return null
  }
}

/**
 * Check if user can access a trip (is a member)
 */
export async function canAccessTrip(tripId: string, userId: string): Promise<boolean> {
  const role = await getUserTripRole(tripId, userId)
  return role !== null
}

/**
 * Check if user is admin of a trip
 */
export async function isTripAdmin(tripId: string, userId: string): Promise<boolean> {
  const role = await getUserTripRole(tripId, userId)
  return role === 'admin'
}

/**
 * Redirect if not authenticated
 * Use in page components
 */
export async function redirectIfNotAuth(redirectTo?: string) {
  const user = await getCurrentAuthUser()
  
  if (!user) {
    const loginUrl = redirectTo 
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginUrl)
  }
}

/**
 * Redirect if authenticated
 * Use in auth pages like login/signup
 */
export async function redirectIfAuth(redirectTo: string = '/dashboard') {
  const user = await getCurrentAuthUser()
  
  if (user) {
    redirect(redirectTo)
  }
}

/**
 * Validate invite token and return trip information
 */
export async function validateInviteToken(token: string) {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .rpc('validate_invite_token', { token_input: token })
    
    if (error) {
      console.error('Error validating invite token:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in validateInviteToken:', error)
    return null
  }
}

/**
 * Use invite token to join a trip
 */
export async function useInviteToken(token: string, userId: string) {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .rpc('use_invite_token', { 
        token_input: token,
        user_id_input: userId 
      })
    
    if (error) {
      console.error('Error using invite token:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Error in useInviteToken:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
