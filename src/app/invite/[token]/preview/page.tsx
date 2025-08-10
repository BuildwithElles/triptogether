import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvitePreview from '@/components/invite/InvitePreview';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, XCircle, Clock } from 'lucide-react';

interface InvitePreviewPageProps {
  params: {
    token: string;
  };
}

// Error component for various invite error states
function InviteError({ 
  title, 
  message, 
  code,
  icon: Icon = AlertCircle 
}: { 
  title: string; 
  message: string; 
  code?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-red-900">
                {title}
              </h1>
              <p className="text-red-700">
                {message}
              </p>
              {code && (
                <p className="text-sm text-red-600 font-mono">
                  Error Code: {code}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                What you can do:
              </p>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Check if the invite link is correct</li>
                <li>• Contact the person who sent you this invite</li>
                <li>• Ask for a new invite link if this one has expired</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading component for initial page load
function InviteLoading() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="text-center space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
            
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function InvitePreviewPage({ params }: InvitePreviewPageProps) {
  const { token } = params;

  // Validate token parameter
  if (!token || typeof token !== 'string') {
    return (
      <InviteError
        title="Invalid Invite Link"
        message="The invite link appears to be malformed or incomplete."
        code="INVALID_TOKEN"
        icon={XCircle}
      />
    );
  }

  try {
    // Get current user (if authenticated) for personalized experience
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch invite data from our API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/invite/${token}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 404:
          return (
            <InviteError
              title="Invite Not Found"
              message={errorData.message || "This invite link is not valid or has been deactivated."}
              code={errorData.code}
              icon={XCircle}
            />
          );
        
        case 410:
          return (
            <InviteError
              title={errorData.error || "Invite Unavailable"}
              message={errorData.message || "This invite is no longer available."}
              code={errorData.code}
              icon={Clock}
            />
          );
        
        default:
          return (
            <InviteError
              title="Error Loading Invite"
              message="There was a problem loading this invite. Please try again later."
              code={errorData.code}
            />
          );
      }
    }

    const data = await response.json();
    
    if (!data.success) {
      return (
        <InviteError
          title={data.error || "Invite Error"}
          message={data.message || "There was a problem with this invite."}
          code={data.code}
        />
      );
    }

    // Check if user is already a member of this trip
    if (user) {
      const { data: membership } = await supabase
        .from('trip_users')
        .select('id, is_active')
        .eq('trip_id', data.trip.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (membership) {
        // User is already a member, redirect to trip dashboard
        redirect(`/trips/${data.trip.id}`);
      }
    }

    // Render the invite preview
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <InvitePreview
          invite={data.invite}
          trip={data.trip}
          isAuthenticated={!!user}
          currentUserEmail={user?.email}
        />
      </div>
    );

  } catch (error) {
    console.error('Invite preview error:', error);
    
    return (
      <InviteError
        title="Loading Error"
        message="There was an unexpected error loading this invite. Please try again later."
        code="INTERNAL_ERROR"
      />
    );
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: InvitePreviewPageProps) {
  const { token } = params;
  
  try {
    // Attempt to fetch trip data for metadata
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/invite/${token}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          title: `Join ${data.trip.title} - TripTogether`,
          description: `You've been invited to join "${data.trip.title}" - a trip to ${data.trip.destination}. Click to view details and join the trip.`,
          openGraph: {
            title: `Join ${data.trip.title}`,
            description: `You've been invited to join a trip to ${data.trip.destination}`,
            type: 'website',
          },
        };
      }
    }
  } catch (error) {
    console.error('Metadata generation error:', error);
  }

  // Fallback metadata
  return {
    title: 'Trip Invitation - TripTogether',
    description: 'You\'ve been invited to join a trip. Click to view details and join.',
  };
}
