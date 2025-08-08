import { createBrowserClient } from '@supabase/ssr';
// import { Database } from '@/lib/types/database'; // Will be created in later tasks

/**
 * Supabase client for client-side components
 * Use this in React components, hooks, and client-side code
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Alternative client creation method for direct usage
 * Used when you need a fresh client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Test connection to Supabase
 * Returns true if connection is successful, false otherwise
 */
export async function testClientConnection(): Promise<boolean> {
  try {
    // Test connection by getting the current user (doesn't require any tables)
    const { data, error } = await supabase.auth.getUser();
    
    // Connection is successful if we get a response (even if no user is logged in)
    if (error && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
      console.error('Supabase client connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase client connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase client connection error:', error);
    return false;
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  
  return user;
}
