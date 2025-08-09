import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * Create a client-side Supabase client for permissions checks
 */
function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Permission levels for different actions
 */
export enum PermissionLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  TRIP_MEMBER = 'trip_member',
  TRIP_ADMIN = 'trip_admin',
  GLOBAL_ADMIN = 'global_admin'
}

/**
 * Trip roles
 */
export type TripRole = 'admin' | 'guest';

/**
 * User permissions interface
 */
export interface UserPermissions {
  canViewTrip: boolean;
  canEditTrip: boolean;
  canDeleteTrip: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageItinerary: boolean;
  canManageBudget: boolean;
  canViewMessages: boolean;
  canSendMessages: boolean;
  canUploadPhotos: boolean;
  canDeletePhotos: boolean;
  role: TripRole | null;
}

/**
 * Get user's role in a specific trip (client-side version)
 */
export async function getUserTripRole(tripId: string, userId: string): Promise<TripRole | null> {
  if (!tripId || !userId) return null;
  
  const supabase = createClientSupabaseClient();
  
  try {
    const { data: membership, error } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error || !membership) {
      return null;
    }
    
    return membership.role as TripRole;
  } catch (error) {
    console.error('Error getting user trip role:', error);
    return null;
  }
}

/**
 * Check if user can access a trip (is a member) - client-side version
 */
export async function canAccessTrip(tripId: string, userId: string): Promise<boolean> {
  if (!tripId || !userId) return false;
  
  const role = await getUserTripRole(tripId, userId);
  return role !== null;
}

/**
 * Check if user is admin of a trip - client-side version
 */
export async function isTripAdmin(tripId: string, userId: string): Promise<boolean> {
  if (!tripId || !userId) return false;
  
  const role = await getUserTripRole(tripId, userId);
  return role === 'admin';
}

/**
 * Check if user is a member (admin or guest) of a trip
 */
export async function isTripMember(tripId: string, userId: string): Promise<boolean> {
  return await canAccessTrip(tripId, userId);
}

/**
 * Get comprehensive permissions for a user in a trip
 */
export async function getUserTripPermissions(tripId: string, userId: string): Promise<UserPermissions> {
  const defaultPermissions: UserPermissions = {
    canViewTrip: false,
    canEditTrip: false,
    canDeleteTrip: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageItinerary: false,
    canManageBudget: false,
    canViewMessages: false,
    canSendMessages: false,
    canUploadPhotos: false,
    canDeletePhotos: false,
    role: null
  };

  if (!tripId || !userId) {
    return defaultPermissions;
  }

  const role = await getUserTripRole(tripId, userId);
  
  if (!role) {
    return defaultPermissions;
  }

  // Base permissions for all trip members
  const memberPermissions: UserPermissions = {
    ...defaultPermissions,
    canViewTrip: true,
    canViewMessages: true,
    canSendMessages: true,
    canUploadPhotos: true,
    canManageItinerary: true,
    canManageBudget: true,
    role
  };

  // Additional permissions for admins
  if (role === 'admin') {
    return {
      ...memberPermissions,
      canEditTrip: true,
      canDeleteTrip: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canDeletePhotos: true, // Admins can delete any photos
    };
  }

  // Guest permissions (basic member permissions)
  return memberPermissions;
}

/**
 * Check if user has specific permission in a trip
 */
export async function hasPermission(
  tripId: string, 
  userId: string, 
  permission: keyof UserPermissions
): Promise<boolean> {
  const permissions = await getUserTripPermissions(tripId, userId);
  return permissions[permission] === true;
}

/**
 * Require specific trip permission - throws error if not allowed
 */
export async function requireTripPermission(
  tripId: string, 
  userId: string, 
  permission: keyof UserPermissions
): Promise<void> {
  const hasPermissionResult = await hasPermission(tripId, userId, permission);
  
  if (!hasPermissionResult) {
    throw new Error(`Permission denied: ${permission} not allowed for user ${userId} in trip ${tripId}`);
  }
}

/**
 * Check multiple permissions at once
 */
export async function hasAllPermissions(
  tripId: string, 
  userId: string, 
  permissions: (keyof UserPermissions)[]
): Promise<boolean> {
  const userPermissions = await getUserTripPermissions(tripId, userId);
  
  return permissions.every(permission => userPermissions[permission] === true);
}

/**
 * Check if any of the permissions are granted
 */
export async function hasAnyPermission(
  tripId: string, 
  userId: string, 
  permissions: (keyof UserPermissions)[]
): Promise<boolean> {
  const userPermissions = await getUserTripPermissions(tripId, userId);
  
  return permissions.some(permission => userPermissions[permission] === true);
}

/**
 * Get list of trips where user has specific role
 */
export async function getUserTripsByRole(userId: string, role?: TripRole): Promise<string[]> {
  if (!userId) return [];
  
  const supabase = createClientSupabaseClient();
  
  try {
    let query = supabase
      .from('trip_users')
      .select('trip_id')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('Error getting user trips by role:', error);
      return [];
    }
    
    return data.map(item => item.trip_id);
  } catch (error) {
    console.error('Error in getUserTripsByRole:', error);
    return [];
  }
}

/**
 * Check if user owns/created a trip (is the original creator)
 */
export async function isTripCreator(tripId: string, userId: string): Promise<boolean> {
  if (!tripId || !userId) return false;
  
  const supabase = createClientSupabaseClient();
  
  try {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('created_by')
      .eq('id', tripId)
      .single();
    
    if (error || !trip) {
      return false;
    }
    
    return trip.created_by === userId;
  } catch (error) {
    console.error('Error checking trip creator:', error);
    return false;
  }
}

/**
 * Permission check helpers for common use cases
 */
export const PermissionChecks = {
  /**
   * Can user view trip details?
   */
  canViewTrip: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canViewTrip'),
  
  /**
   * Can user edit trip settings?
   */
  canEditTrip: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canEditTrip'),
  
  /**
   * Can user invite new members?
   */
  canInviteMembers: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canInviteMembers'),
  
  /**
   * Can user manage itinerary items?
   */
  canManageItinerary: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canManageItinerary'),
  
  /**
   * Can user manage budget and expenses?
   */
  canManageBudget: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canManageBudget'),
  
  /**
   * Can user send messages in trip chat?
   */
  canSendMessages: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canSendMessages'),
  
  /**
   * Can user upload photos to trip gallery?
   */
  canUploadPhotos: async (tripId: string, userId: string) => 
    await hasPermission(tripId, userId, 'canUploadPhotos'),
};

/**
 * Utility to wrap async permission checks for React components
 */
export function usePermissionCheck() {
  return {
    checkPermission: async (tripId: string, userId: string, permission: keyof UserPermissions) => {
      try {
        return await hasPermission(tripId, userId, permission);
      } catch (error) {
        console.error('Permission check failed:', error);
        return false;
      }
    },
    
    checkMultiplePermissions: async (tripId: string, userId: string, permissions: (keyof UserPermissions)[]) => {
      try {
        const results = await Promise.all(
          permissions.map(permission => hasPermission(tripId, userId, permission))
        );
        
        return permissions.reduce((acc, permission, index) => {
          acc[permission] = results[index];
          return acc;
        }, {} as Record<keyof UserPermissions, boolean>);
      } catch (error) {
        console.error('Multiple permission check failed:', error);
        return permissions.reduce((acc, permission) => {
          acc[permission] = false;
          return acc;
        }, {} as Record<keyof UserPermissions, boolean>);
      }
    }
  };
}

/**
 * HOF to create permission-based middleware for API routes
 */
export function withTripPermission(permission: keyof UserPermissions) {
  return function (handler: Function) {
    return async function (request: any, context: any) {
      // This would be used in API routes
      // Implementation would depend on how you extract tripId and userId from the request
      const { tripId, userId } = context.params || {};
      
      if (!await hasPermission(tripId, userId, permission)) {
        return new Response('Permission denied', { status: 403 });
      }
      
      return handler(request, context);
    };
  };
}
