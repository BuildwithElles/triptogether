/**
 * Auth Error Page
 * 
 * Displays authentication errors to users when auth flow fails
 */

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  const getErrorTitle = (errorCode: string | null): string => {
    switch (errorCode) {
      case 'missing_code':
        return 'Authentication Code Missing'
      case 'exchange_failed':
        return 'Authentication Failed'
      case 'session_failed':
        return 'Session Creation Failed'
      case 'unexpected':
        return 'Unexpected Error'
      default:
        return 'Authentication Error'
    }
  }

  const getErrorMessage = (errorCode: string | null, description: string | null): string => {
    if (description) return description
    
    switch (errorCode) {
      case 'missing_code':
        return 'No authorization code was received from the authentication provider.'
      case 'exchange_failed':
        return 'Failed to exchange authorization code for a session.'
      case 'session_failed':
        return 'Failed to create a valid session after authentication.'
      case 'unexpected':
        return 'An unexpected error occurred during the authentication process.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-red-600">
          {getErrorTitle(error)}
        </CardTitle>
        <CardDescription>
          We encountered an issue while trying to sign you in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm">
            {getErrorMessage(error, description)}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Try Signing In Again
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>
            If this problem persists, please contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Suspense fallback={
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </CardContent>
          </Card>
        }>
          <AuthErrorContent />
        </Suspense>
      </div>
    </div>
  )
}
