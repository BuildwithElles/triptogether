'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface InviteJoinPageProps {
  params: {
    token: string;
  };
}

// Type definitions for API responses
interface JoinResponse {
  success: boolean;
  message: string;
  trip?: {
    id: string;
    title: string;
  };
  redirect_url?: string;
  error?: string;
  code?: string;
}

// Join status states
type JoinStatus = 'checking' | 'joining' | 'success' | 'error' | 'auth_required';

interface JoinState {
  status: JoinStatus;
  message: string;
  tripId?: string;
  tripTitle?: string;
  redirectUrl?: string;
  errorCode?: string;
}

export default function InviteJoinPage({ params }: InviteJoinPageProps) {
  const { token } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [joinState, setJoinState] = useState<JoinState>({
    status: 'checking',
    message: 'Checking invite...',
  });

  // Auto-redirect counter for success state
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Start countdown for auto-redirect
  const startRedirectCountdown = useCallback((redirectUrl: string) => {
    let countdown = 5;
    const interval = setInterval(() => {
      countdown -= 1;
      setRedirectCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        router.replace(redirectUrl);
      }
    }, 1000);
  }, [router]);

  // Handle the trip joining process
  const handleJoinTrip = useCallback(async () => {
    try {
      setJoinState({
        status: 'joining',
        message: 'Joining trip...',
      });

      const response = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' }),
      });

      const data: JoinResponse = await response.json();

      if (data.success) {
        setJoinState({
          status: 'success',
          message: data.message,
          tripId: data.trip?.id,
          tripTitle: data.trip?.title,
          redirectUrl: data.redirect_url,
        });

        // Start countdown for auto-redirect
        if (data.redirect_url) {
          startRedirectCountdown(data.redirect_url);
        }
      } else {
        setJoinState({
          status: 'error',
          message: data.message || 'Failed to join trip.',
          errorCode: data.code,
        });
      }
    } catch (error) {
      console.error('Join trip error:', error);
      setJoinState({
        status: 'error',
        message: 'An unexpected error occurred while joining the trip.',
        errorCode: 'NETWORK_ERROR',
      });
    }
  }, [token, startRedirectCountdown]);

  // Check authentication and handle join flow
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to load
    }

    if (!user) {
      // User not authenticated, redirect to login with return URL
      const loginUrl = `/login?redirectTo=${encodeURIComponent(`/invite/${token}/join`)}`;
      router.replace(loginUrl);
      return;
    }

    // User is authenticated, proceed with join
    handleJoinTrip();
  }, [user, authLoading, token, router, handleJoinTrip]);

  // Manual redirect handler
  const handleManualRedirect = () => {
    if (joinState.redirectUrl) {
      router.replace(joinState.redirectUrl);
    }
  };

  // Retry join handler
  const handleRetry = () => {
    handleJoinTrip();
  };

  // Render loading state
  if (authLoading || joinState.status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {joinState.message}
                </h2>
                <p className="text-sm text-gray-600">
                  Please wait while we process your invite...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render joining state
  if (joinState.status === 'joining') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  Joining Trip...
                </h2>
                <p className="text-sm text-gray-600">
                  We&apos;re adding you to the trip. This should only take a moment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render success state
  if (joinState.status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">
              Successfully Joined!
            </CardTitle>
            <CardDescription className="text-green-700">
              {joinState.message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {joinState.tripTitle && (
              <div className="text-center">
                <p className="text-sm text-green-700">
                  You are now a member of:
                </p>
                <p className="font-semibold text-green-900">
                  {joinState.tripTitle}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleManualRedirect}
                className="w-full"
                size="lg"
              >
                Go to Trip Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-green-600">
                  Redirecting automatically in {redirectCountdown} seconds...
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-green-600">
                What&apos;s next? You can now view the trip itinerary, contribute to planning, and access all trip features.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (joinState.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">
              Unable to Join Trip
            </CardTitle>
            <CardDescription className="text-red-700">
              {joinState.message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {joinState.errorCode && (
              <div className="text-center">
                <p className="text-xs text-red-600 font-mono">
                  Error Code: {joinState.errorCode}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Show appropriate action based on error */}
              {joinState.errorCode === 'ALREADY_MEMBER' ? (
                <Button 
                  onClick={() => router.replace('/dashboard')}
                  className="w-full"
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              ) : joinState.errorCode === 'INVITE_EXPIRED' || joinState.errorCode === 'INVITE_USED_UP' ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-600">
                    This invite is no longer valid. Please contact the trip organizer for a new invite.
                  </p>
                  <Button 
                    onClick={() => router.replace('/dashboard')}
                    className="w-full"
                    variant="outline"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={handleRetry}
                    className="w-full"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => router.replace(`/invite/${token}/preview`)}
                    className="w-full"
                    variant="ghost"
                  >
                    View Invite Details
                  </Button>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-xs text-red-600">
                If this problem persists, please contact the person who sent you this invite.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback render (should not reach here)
  return null;
}
