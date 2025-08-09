import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the pathname
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/trips',
    '/profile',
    '/settings'
  ]

  // Define auth routes (should redirect to dashboard if authenticated)
  const authRoutes = [
    '/login',
    '/signup'
  ]

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/invite',
    '/auth/confirm',
    '/auth/error'
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is an invite route (special handling)
  const isInviteRoute = pathname.startsWith('/invite/')

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    // Store the intended destination
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    // Check if there's a redirectTo parameter
    const redirectTo = url.searchParams.get('redirectTo')
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // Default redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For invite routes, allow both authenticated and unauthenticated users
  // The component will handle the logic for joining vs previewing
  if (isInviteRoute) {
    return supabaseResponse
  }

  // Allow access to public routes regardless of auth status
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return supabaseResponse
  }

  // For API routes, let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // For all other routes, return the response
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
