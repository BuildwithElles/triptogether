/**
 * Supabase Auth Configuration
 * 
 * This file contains configuration settings for Supabase authentication,
 * including auth options, redirect URLs, and session management settings.
 */

import type { User, Session } from '@supabase/supabase-js'

// Auth configuration constants
export const AUTH_CONFIG = {
  // Session settings
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  
  // Security settings
  flowType: 'pkce' as const,
  
  // URL configuration
  redirectTo: {
    // Auth callback URL - handles the response from Supabase after auth
    callback: process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com/api/auth/callback'
      : 'http://localhost:3000/api/auth/callback',
    
    // Post-auth redirect URLs
    signIn: '/dashboard',
    signUp: '/dashboard',
    signOut: '/',
    passwordReset: '/auth/reset-password',
  },
  
  // Email settings
  email: {
    confirmationRequired: true,
    redirectTo: process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com/auth/confirm'
      : 'http://localhost:3000/auth/confirm',
  },
  
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  },
} as const

// Supabase Auth configuration object for client initialization
export const authOptions = {
  flowType: AUTH_CONFIG.flowType,
  autoRefreshToken: AUTH_CONFIG.autoRefreshToken,
  persistSession: AUTH_CONFIG.persistSession,
  detectSessionInUrl: AUTH_CONFIG.detectSessionInUrl,
} as const

// Auth event types we'll handle
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

// Auth state type
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// Auth action types for context reducer
export type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User | null; session: Session | null } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SIGN_OUT' }

// Helper function to get redirect URL for auth operations
export function getAuthRedirectUrl(path: string): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
    : 'http://localhost:3000'
  
  return `${baseUrl}${path}`
}

// Helper function to validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < AUTH_CONFIG.password.minLength) {
    errors.push(`Password must be at least ${AUTH_CONFIG.password.minLength} characters long`)
  }
  
  if (AUTH_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (AUTH_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (AUTH_CONFIG.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (AUTH_CONFIG.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to validate email format
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Error messages for common auth errors
export const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
  'Email already registered': 'An account with this email already exists. Please sign in instead.',
  'Weak password': 'Password is too weak. Please choose a stronger password.',
  'Invalid email': 'Please enter a valid email address.',
  'User not found': 'No account found with this email address.',
  'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
  'Too many requests': 'Too many login attempts. Please wait a moment before trying again.',
  default: 'An error occurred during authentication. Please try again.',
} as const

// Function to get user-friendly error message
export function getAuthErrorMessage(error: string): string {
  return AUTH_ERROR_MESSAGES[error as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default
}
