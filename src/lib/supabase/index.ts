// Client-side Supabase utilities
export { 
  supabase,
  createClient as createBrowserClient,
  testClientConnection,
  getCurrentSession,
  getCurrentUser 
} from './client';

// Server-side Supabase utilities
export { 
  createClient as createServerClient,
  createAdminClient,
  testServerConnection,
  testAdminConnection,
  getUser as getServerUser,
  getSession as getServerSession 
} from './server';
