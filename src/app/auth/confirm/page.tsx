/**
 * Auth Confirmation Page
 * 
 * Handles email confirmation after user registration
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import Link from 'next/link'

type ConfirmationState = 'confirming' | 'success' | 'error' | 'expired'

function AuthConfirmContent() {
  const [state, setState] = useState<ConfirmationState>('confirming')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!token_hash || type !== 'email') {
        setState('error')
        setErrorMessage('Invalid confirmation link')
        return
      }

      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setState('error')
          
          if (error.message.includes('expired')) {
            setState('expired')
            setErrorMessage('The confirmation link has expired')
          } else {
            setErrorMessage(error.message)
          }
        } else {
          setState('success')
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (error) {
        console.error('Unexpected error during confirmation:', error)
        setState('error')
        setErrorMessage('An unexpected error occurred')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  const renderContent = () => {
    switch (state) {
      case 'confirming':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle>Confirming Your Email</CardTitle>
              <CardDescription>
                Please wait while we confirm your email address...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </CardContent>
          </>
        )

      case 'success':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-green-600">Email Confirmed!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. Redirecting to dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Button asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </>
        )

      case 'expired':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-orange-600">Link Expired</CardTitle>
              <CardDescription>
                The confirmation link has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <p className="text-orange-700 text-sm">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Sign In to Resend
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/signup">
                    Create New Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </>
        )

      case 'error':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">Confirmation Failed</CardTitle>
              <CardDescription>
                There was an error confirming your email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700 text-sm">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth/signup">
                    Try Signing Up Again
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </>
        )
    }
  }

  return (
    <Card>
      {renderContent()}
    </Card>
  )
}

export default function AuthConfirmPage() {
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
          <AuthConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}
