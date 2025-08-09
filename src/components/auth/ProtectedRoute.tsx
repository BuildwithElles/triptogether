'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  className?: string;
}

/**
 * ProtectedRoute component that wraps protected pages
 * Handles authentication state and loading during auth checks
 */
export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true,
  redirectTo,
  className 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        {fallback || (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        )}
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    // In client components, we can't redirect directly
    // The middleware should handle redirects, but this is a fallback
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
          <button
            onClick={() => window.location.href = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}

interface TripProtectedRouteProps extends ProtectedRouteProps {
  tripId: string;
  requireRole?: 'admin' | 'guest' | 'member';
}

/**
 * TripProtectedRoute component for trip-specific protection
 * Checks both authentication and trip membership/role
 */
export function TripProtectedRoute({
  children,
  tripId,
  requireRole = 'member',
  fallback,
  className,
  ...props
}: TripProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [tripLoading, setTripLoading] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);
  const [userRole, setUserRole] = React.useState<'admin' | 'guest' | null>(null);

  React.useEffect(() => {
    async function checkTripAccess() {
      if (!user || !tripId) {
        setTripLoading(false);
        return;
      }

      try {
        // Import permissions utils dynamically to avoid SSR issues
        const { getUserTripRole, canAccessTrip } = await import('@/lib/utils/permissions');
        
        const hasAccess = await canAccessTrip(tripId, user.id);
        const role = await getUserTripRole(tripId, user.id);
        
        setHasAccess(hasAccess);
        setUserRole(role);
        
        // Check role requirements
        if (requireRole === 'admin' && role !== 'admin') {
          setHasAccess(false);
        }
        
      } catch (error) {
        console.error('Error checking trip access:', error);
        setHasAccess(false);
      } finally {
        setTripLoading(false);
      }
    }

    checkTripAccess();
  }, [user, tripId, requireRole]);

  // Show loading while checking authentication or trip access
  if (loading || tripLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        {fallback || (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">
              {loading ? 'Checking authentication...' : 'Checking trip access...'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // If user doesn't have access to the trip
  if (!hasAccess) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">
            {!user 
              ? 'You need to be logged in to access this trip.'
              : requireRole === 'admin' && userRole !== 'admin'
              ? 'You need admin privileges to access this page.'
              : 'You are not a member of this trip.'
            }
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Wrap with basic protection and render children
  return (
    <ProtectedRoute {...props} className={className}>
      {children}
    </ProtectedRoute>
  );
}

interface AdminRouteProps extends ProtectedRouteProps {
  adminCheck?: () => Promise<boolean>;
}

/**
 * AdminRoute component for admin-only pages
 * Provides a generic admin protection wrapper
 */
export function AdminRoute({ 
  children, 
  adminCheck,
  fallback,
  className,
  ...props 
}: AdminRouteProps) {
  const { user, loading } = useAuth();
  const [adminLoading, setAdminLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setAdminLoading(false);
        return;
      }

      try {
        if (adminCheck) {
          const adminStatus = await adminCheck();
          setIsAdmin(adminStatus);
        } else {
          // Default admin check - you might want to implement global admin role
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, adminCheck]);

  // Show loading while checking admin status
  if (loading || adminLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        {fallback || (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        )}
      </div>
    );
  }

  // If user is not admin
  if (!isAdmin) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Admin Access Required</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Wrap with basic protection and render children
  return (
    <ProtectedRoute {...props} className={className}>
      {children}
    </ProtectedRoute>
  );
}
