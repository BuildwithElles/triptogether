import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Type definitions matching API response
interface InviteData {
  id: string;
  token: string;
  max_uses: number;
  current_uses: number;
  expires_at: string;
  is_active: boolean;
  email?: string;
}

interface TripData {
  id: string;
  title: string;
  description?: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
  member_count: number;
  created_by: {
    id: string;
    name?: string;
    email: string;
  };
}

interface InvitePreviewProps {
  invite: InviteData;
  trip: TripData;
  isAuthenticated?: boolean;
  currentUserEmail?: string;
  onJoin?: () => void;
  isJoining?: boolean;
}

// Helper function to get status badge variant
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default';
    case 'planning':
      return 'secondary';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// Helper function to format trip dates
function formatTripDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.toDateString() === end.toDateString()) {
    return format(start, 'MMMM d, yyyy');
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

// Helper function to check if invite is expiring soon (within 24 hours)
function isExpiringSoon(expiresAt: string): boolean {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const timeDiff = expiry.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);
  
  return hoursDiff > 0 && hoursDiff <= 24;
}

// Helper function to get remaining uses text
function getRemainingUsesText(current: number, max: number): string {
  const remaining = max - current;
  if (remaining === 1) {
    return '1 use remaining';
  }
  return `${remaining} uses remaining`;
}

export default function InvitePreview({ 
  invite, 
  trip, 
  isAuthenticated = false,
  currentUserEmail,
  onJoin,
  isJoining = false 
}: InvitePreviewProps) {
  const isExpiring = isExpiringSoon(invite.expires_at);
  const hasRemainingUses = invite.current_uses < invite.max_uses;
  const isEmailRestricted = invite.email && invite.email !== currentUserEmail;
  
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          You&apos;re Invited!
        </h1>
        <p className="text-gray-600">
          {trip.created_by.name || 'Someone'} has invited you to join their trip
        </p>
      </div>

      {/* Trip Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{trip.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {trip.destination}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(trip.status)}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Trip Description */}
          {trip.description && (
            <p className="text-gray-700 leading-relaxed">
              {trip.description}
            </p>
          )}
          
          {/* Trip Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dates */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dates</p>
                <p className="text-sm text-gray-600">
                  {formatTripDates(trip.start_date, trip.end_date)}
                </p>
              </div>
            </div>
            
            {/* Members */}
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Members</p>
                <p className="text-sm text-gray-600">
                  {trip.member_count} {trip.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
            
            {/* Organizer */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Organizer</p>
                <p className="text-sm text-gray-600">
                  {trip.created_by.name || trip.created_by.email}
                </p>
              </div>
            </div>
            
            {/* Invite Expiry */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Invite Expires</p>
                <p className={`text-sm ${isExpiring ? 'text-orange-600' : 'text-gray-600'}`}>
                  {format(new Date(invite.expires_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Status Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Invite Usage */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Invite Usage
              </span>
              <span className="text-sm text-gray-600">
                {getRemainingUsesText(invite.current_uses, invite.max_uses)}
              </span>
            </div>
            
            {/* Email Restriction */}
            {invite.email && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  This invite is restricted to: {invite.email}
                </span>
              </div>
            )}
            
            {/* Expiry Warning */}
            {isExpiring && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">
                  This invite expires within 24 hours
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            {/* Authenticated User Actions */}
            {isEmailRestricted ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  This invite is restricted to {invite.email}
                </p>
                <p className="text-sm text-gray-600">
                  You are logged in as {currentUserEmail}
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Email Restriction Applied
                </Button>
              </div>
            ) : !hasRemainingUses ? (
              <Button variant="outline" className="w-full" disabled>
                Invite Limit Reached
              </Button>
            ) : (
              <Button 
                onClick={onJoin}
                disabled={isJoining}
                className="w-full"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Joining Trip...
                  </>
                ) : (
                  'Join Trip'
                )}
              </Button>
            )}
            
            <div className="text-center">
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unauthenticated User Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button asChild size="lg">
                <Link href={`/login?redirectTo=${encodeURIComponent(`/invite/${invite.token}/join`)}`}>
                  Log In to Join
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href={`/signup?redirectTo=${encodeURIComponent(`/invite/${invite.token}/join`)}`}>
                  Sign Up to Join
                </Link>
              </Button>
            </div>
            
            <div className="text-center">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Learn more about TripTogether
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              What happens when you join?
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You&apos;ll be added to the trip as a member</li>
              <li>• You can view and contribute to the itinerary</li>
              <li>• Access shared trip information and planning tools</li>
              <li>• Participate in trip discussions and photo sharing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
