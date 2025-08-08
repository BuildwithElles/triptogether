/**
 * Auth Login API Route
 * 
 * Handles user login with email and password
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

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
            // Cookies will be set in the response
          },
          remove(name: string, options: CookieOptions) {
            // Cookies will be handled in the response
          },
        },
      }
    )

    // Attempt to sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      
      // Return user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your credentials and try again.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please check your email and click the confirmation link before signing in.' },
          { status: 401 }
        )
      }

      if (error.message.includes('Too many requests')) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please wait a moment before trying again.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Check if user and session exist
    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    console.log('User signed in successfully:', data.user.email)

    // Create response
    const response = NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at ? true : false,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
      },
      session: data.session,
    })

    // Set authentication cookies
    response.cookies.set('supabase-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
      path: '/',
    })

    response.cookies.set('supabase-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Unexpected login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering to ensure cookies are handled properly
export const dynamic = 'force-dynamic'
