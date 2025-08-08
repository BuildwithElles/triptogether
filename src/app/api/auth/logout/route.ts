/**
 * Auth Logout API Route
 * 
 * Handles user logout and session cleanup
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Cookies will be cleared in the response
          },
          remove(name: string, options: CookieOptions) {
            // Cookies will be cleared in the response
          },
        },
      }
    )

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      // Even if there's an error, we'll still clear the cookies
    }

    console.log('User signed out successfully')

    // Create response
    const response = NextResponse.json({
      message: 'Signed out successfully'
    })

    // Clear authentication cookies
    response.cookies.set('supabase-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('supabase-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Unexpected logout error:', error)
    
    // Even on error, return success and clear cookies
    const response = NextResponse.json({
      message: 'Signed out successfully'
    })

    // Clear cookies anyway
    response.cookies.set('supabase-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('supabase-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  }
}

// Force dynamic rendering to ensure cookies are handled properly
export const dynamic = 'force-dynamic'
