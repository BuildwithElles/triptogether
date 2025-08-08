/**
 * Auth Callback Route Handler
 * 
 * This API route handles the callback from Supabase after authentication.
 * It exchanges the auth code for a session and redirects the user appropriately.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle auth errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || 'Authentication failed')}`
    )
  }

  // Redirect to error page if no code is provided
  if (!code) {
    console.error('Auth callback missing code parameter')
    return NextResponse.redirect(
      `${origin}/auth/error?error=missing_code&description=${encodeURIComponent('No authorization code received')}`
    )
  }

  try {
    // Create Supabase server client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Exchange the auth code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/error?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Verify we have a valid session
    if (!data.session || !data.user) {
      console.error('No session or user after code exchange')
      return NextResponse.redirect(
        `${origin}/auth/error?error=session_failed&description=${encodeURIComponent('Failed to create session')}`
      )
    }

    console.log('Auth callback successful for user:', data.user.email)

    // Create response with redirect
    const response = NextResponse.redirect(`${origin}${next}`)

    // Set session cookies
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
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${origin}/auth/error?error=unexpected&description=${encodeURIComponent('An unexpected error occurred during authentication')}`
    )
  }
}

// Force dynamic rendering for this route to ensure cookies are handled properly
export const dynamic = 'force-dynamic'
