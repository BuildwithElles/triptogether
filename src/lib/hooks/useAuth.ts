/**
 * useAuth Hook
 * 
 * Custom hook that provides a clean interface to the authentication context.
 * This hook encapsulates all authentication-related functionality and provides
 * convenient methods for components to interact with the auth system.
 */

'use client'

import { useAuthContext } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { AUTH_CONFIG } from '../auth/config'

// Return type for the useAuth hook
export interface UseAuthReturn {
  // Auth state
  user: any | null
  session: any | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  
  // Auth methods
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updateProfile: (updates: { name?: string; email?: string }) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
  
  // Navigation helpers
  redirectToLogin: (returnUrl?: string) => void
  redirectToDashboard: () => void
  redirectAfterAuth: () => void
  
  // Utility methods
  clearError: () => void
  getUserDisplayName: () => string
  getUserEmail: () => string | null
  getUserId: () => string | null
}

/**
 * useAuth Hook
 * 
 * Provides authentication state and methods with additional utility functions.
 * This is the primary hook that components should use for authentication.
 */
export function useAuth(): UseAuthReturn {
  const authContext = useAuthContext()
  const router = useRouter()

  // Destructure context values
  const {
    user,
    session,
    loading,
    error,
    signUp: contextSignUp,
    signIn: contextSignIn,
    signOut: contextSignOut,
    resetPassword,
    updateProfile,
    refreshSession,
  } = authContext

  // Computed values
  const isAuthenticated = useMemo(() => {
    return !!(user && session)
  }, [user, session])

  // Check if user is an admin (for future role-based features)
  const isAdmin = useMemo(() => {
    // For now, we don't have admin roles implemented yet
    // This can be expanded when we add role-based access control
    return false
  }, [user])

  // Enhanced sign up with name handling
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const metadata = name ? { name } : undefined
    return contextSignUp(email, password, metadata)
  }, [contextSignUp])

  // Enhanced sign in with redirect handling
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await contextSignIn(email, password)
    
    // If sign in was successful, redirect to dashboard
    if (!result.error) {
      // Small delay to ensure state updates
      setTimeout(() => {
        redirectAfterAuth()
      }, 100)
    }
    
    return result
  }, [contextSignIn])

  // Enhanced sign out with redirect
  const signOut = useCallback(async () => {
    const result = await contextSignOut()
    
    // If sign out was successful, redirect to home
    if (!result.error) {
      router.push(AUTH_CONFIG.redirectTo.signOut)
    }
  }, [contextSignOut, router])

  // Navigation helpers
  const redirectToLogin = useCallback((returnUrl?: string) => {
    const url = returnUrl 
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/login'
    router.push(url)
  }, [router])

  const redirectToDashboard = useCallback(() => {
    router.push(AUTH_CONFIG.redirectTo.signIn)
  }, [router])

  const redirectAfterAuth = useCallback(() => {
    // Check if there's a return URL in the URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const returnUrl = urlParams.get('returnUrl')
      
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl))
        return
      }
    }
    
    // Default redirect after auth
    redirectToDashboard()
  }, [router, redirectToDashboard])

  // Utility methods
  const clearError = useCallback(() => {
    // The context doesn't expose a clearError method directly,
    // but errors are cleared automatically on successful operations
    // This is a placeholder for future error clearing functionality
  }, [])

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'Guest'
    
    // Try to get name from user metadata first
    const name = user.user_metadata?.name || user.user_metadata?.full_name
    if (name) return name
    
    // Fall back to email prefix
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    return 'User'
  }, [user])

  const getUserEmail = useCallback(() => {
    return user?.email || null
  }, [user])

  const getUserId = useCallback(() => {
    return user?.id || null
  }, [user])

  // Return the complete auth interface
  return {
    // State
    user,
    session,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    
    // Methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
    
    // Navigation
    redirectToLogin,
    redirectToDashboard,
    redirectAfterAuth,
    
    // Utilities
    clearError,
    getUserDisplayName,
    getUserEmail,
    getUserId,
  }
}

// Export individual hook components for specific use cases

/**
 * useAuthState Hook
 * 
 * Returns only the authentication state without methods.
 * Useful for components that only need to read auth state.
 */
export function useAuthState() {
  const { user, session, loading, error, isAuthenticated, isAdmin } = useAuth()
  
  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    isAdmin,
  }
}

/**
 * useAuthActions Hook
 * 
 * Returns only the authentication methods without state.
 * Useful for components that only need to perform auth actions.
 */
export function useAuthActions() {
  const {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  } = useAuth()
  
  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  }
}

/**
 * useAuthNavigation Hook
 * 
 * Returns navigation helpers for auth-related redirects.
 * Useful for components that handle auth flow navigation.
 */
export function useAuthNavigation() {
  const {
    redirectToLogin,
    redirectToDashboard,
    redirectAfterAuth,
  } = useAuth()
  
  return {
    redirectToLogin,
    redirectToDashboard,
    redirectAfterAuth,
  }
}

/**
 * useAuthUser Hook
 * 
 * Returns user-specific data and utilities.
 * Useful for components that need user information.
 */
export function useAuthUser() {
  const {
    user,
    isAuthenticated,
    getUserDisplayName,
    getUserEmail,
    getUserId,
  } = useAuth()
  
  return {
    user,
    isAuthenticated,
    getUserDisplayName,
    getUserEmail,
    getUserId,
  }
}
