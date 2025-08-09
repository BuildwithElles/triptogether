/**
 * Authentication Context
 * 
 * Provides authentication state management throughout the application.
 * Handles user session, loading states, and authentication state changes.
 */

'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'
import type { Database } from '../types/database'
import { AUTH_CONFIG, type AuthState, type AuthAction, getAuthErrorMessage } from '../auth/config'

// AuthContext type definition
interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updateProfile: (updates: { name?: string; email?: string }) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth reducer to manage authentication state
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null, // Clear error when setting loading
      }
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        error: null,
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    
    case 'SIGN_OUT':
      return {
        ...state,
        user: null,
        session: null,
        loading: false,
        error: null,
      }
    
    default:
      return state
  }
}

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  session: null,
  loading: true, // Start with loading true while we check for existing session
  error: null,
}

// AuthProvider Props
interface AuthProviderProps {
  children: ReactNode
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const supabase = createClient()

  // Handle authentication state changes
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          dispatch({ type: 'SET_ERROR', payload: getAuthErrorMessage(error.message) })
          return
        }

        dispatch({
          type: 'SET_USER',
          payload: {
            user: session?.user ?? null,
            session: session,
          }
        })
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' })
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          dispatch({
            type: 'SET_USER',
            payload: {
              user: session?.user ?? null,
              session: session,
            }
          })
          break
        
        case 'SIGNED_OUT':
          dispatch({ type: 'SIGN_OUT' })
          break
        
        case 'USER_UPDATED':
          if (session) {
            dispatch({
              type: 'SET_USER',
              payload: {
                user: session.user,
                session: session,
              }
            })
          }
          break
        
        default:
          // Handle other events if needed
          break
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: AUTH_CONFIG.email.redirectTo,
          data: metadata || {},
        },
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { error: errorMessage }
      }

      // If email confirmation is required, don't update state yet
      if (AUTH_CONFIG.email.confirmationRequired && !data.session) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return {}
      }

      // User is signed in immediately (email confirmation disabled)
      dispatch({
        type: 'SET_USER',
        payload: {
          user: data.user,
          session: data.session,
        }
      })

      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during sign up'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { error: errorMessage }
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { error: errorMessage }
      }

      dispatch({
        type: 'SET_USER',
        payload: {
          user: data.user,
          session: data.session,
        }
      })

      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during sign in'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { error: errorMessage }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { error: errorMessage }
      }

      dispatch({ type: 'SIGN_OUT' })
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during sign out'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { error: errorMessage }
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_CONFIG.redirectTo.passwordReset,
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { error: errorMessage }
      }

      dispatch({ type: 'SET_LOADING', payload: false })
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while resetting password'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { error: errorMessage }
    }
  }

  // Update user profile function
  const updateProfile = async (updates: { name?: string; email?: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { data, error } = await supabase.auth.updateUser({
        email: updates.email,
        data: updates.name ? { name: updates.name } : {},
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message)
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return { error: errorMessage }
      }

      dispatch({
        type: 'SET_USER',
        payload: {
          user: data.user,
          session: state.session, // Keep existing session
        }
      })

      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while updating profile'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { error: errorMessage }
    }
  }

  // Refresh session function
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      dispatch({
        type: 'SET_USER',
        payload: {
          user: session?.user ?? null,
          session: session,
        }
      })
    } catch (error) {
      console.error('Unexpected error refreshing session:', error)
    }
  }

  // Context value
  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use AuthContext
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// Export the context for advanced use cases
export { AuthContext }
