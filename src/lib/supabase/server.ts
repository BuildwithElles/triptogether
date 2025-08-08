import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '../types/database';

/**
 * Create a Supabase client for server-side usage
 * Use this in API routes, server components, and middleware
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role for admin operations
 * Use this for operations that require elevated privileges
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service role client
        },
      },
    }
  );
}

/**
 * Test server connection to Supabase
 * Returns true if connection is successful, false otherwise
 */
export async function testServerConnection(): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Test connection by getting the current user (doesn't require any tables)
    const { data, error } = await supabase.auth.getUser();
    
    // Connection is successful if we get a response (even if no user is logged in)
    if (error && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
      console.error('Supabase server connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase server connection error:', error);
    return false;
  }
}

/**
 * Test admin connection to Supabase
 * Returns true if admin connection is successful, false otherwise
 */
export async function testAdminConnection(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    // Test admin connection by getting the current user
    const { data, error } = await supabase.auth.getUser();
    
    // Connection is successful if we get a response (even if no user is logged in)
    if (error && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
      console.error('Supabase admin connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase admin connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase admin connection error:', error);
    return false;
  }
}

/**
 * Get user from server-side context
 */
export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user from server:', error.message);
    return null;
  }
  
  return user;
}

/**
 * Get session from server-side context
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session from server:', error.message);
    return null;
  }
  
  return session;
}
