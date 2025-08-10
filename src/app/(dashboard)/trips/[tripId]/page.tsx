'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  DollarSign, 
  Package, 
  MessageCircle, 
  Camera, 
  Shirt,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TripHeader from '@/components/trip/TripHeader';
import MembersList from '@/components/trip/MembersList';
import { InviteLink } from '@/components/trip/InviteLink';
import { useAuth } from '@/lib/hooks/useAuth';

interface TripMember {
  id: string;
  userId: string;
  role: 'admin' | 'guest';
  joinedAt: string;
  invitationAcceptedAt: string | null;
  nickname: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

interface Trip {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  budgetTotal: number | null;
  maxMembers: number | null;
  isPublic: boolean;
  members: TripMember[];
  memberCount: number;
  userRole: 'admin' | 'guest';
}

const TripDashboard: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!tripId || !user) return;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/trips/${tripId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch trip');
        }

        // Add current user's info to members for display
        const enhancedMembers = data.trip.members.map((member: any) => {
          if (member.userId === user.id) {
            return {
              ...member,
              email: user.email || '',
              fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
              avatarUrl: user.user_metadata?.avatar_url || null,
            };
          }
          return {
            ...member,
            email: member.email || 'Unknown',
            fullName: member.fullName || member.nickname || 'Member',
            avatarUrl: member.avatarUrl,
          };
        });

        setTrip({
          ...data.trip,
          members: enhancedMembers,
        });
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, user]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleEditTrip = () => {
    // TODO: Implement edit trip modal/page
    console.log('Edit trip:', trip?.id);
  };

  const handleShareTrip = () => {
    // TODO: Implement share/invite functionality
    console.log('Share trip:', trip?.id);
  };

  const handleInviteMembers = () => {
    setShowInviteModal(true);
  };

  const handleManageMember = (member: TripMember) => {
    // TODO: Implement member management (remove, change role, etc.)
    console.log('Manage member:', member);
  };

  const navigateToFeature = (feature: string) => {
    router.push(`/trips/${tripId}/${feature}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading trip...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No trip found
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
              <p className="text-gray-600 mb-6">
                The trip you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Button onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featureCards = [
    {
      id: 'itinerary',
      title: 'Itinerary',
      description: 'Plan your daily activities and schedule',
      icon: Calendar,
      color: 'bg-blue-500',
      path: 'itinerary',
    },
    {
      id: 'budget',
      title: 'Budget',
      description: 'Track expenses and split costs',
      icon: DollarSign,
      color: 'bg-green-500',
      path: 'budget',
    },
    {
      id: 'packing',
      title: 'Packing',
      description: 'Organize your packing lists',
      icon: Package,
      color: 'bg-purple-500',
      path: 'packing',
    },
    {
      id: 'chat',
      title: 'Chat',
      description: 'Message your travel companions',
      icon: MessageCircle,
      color: 'bg-orange-500',
      path: 'chat',
    },
    {
      id: 'gallery',
      title: 'Gallery',
      description: 'Share photos and memories',
      icon: Camera,
      color: 'bg-pink-500',
      path: 'gallery',
    },
    {
      id: 'outfits',
      title: 'Outfits',
      description: 'Plan your outfits for each day',
      icon: Shirt,
      color: 'bg-indigo-500',
      path: 'outfits',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Back button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Back to Dashboard</span>
            <span className="xs:hidden">Back</span>
          </Button>
        </div>

        {/* Trip Header */}
        <TripHeader
          trip={trip}
          onEdit={handleEditTrip}
          onShare={handleShareTrip}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Feature Navigation Cards */}
          <div className="xl:col-span-2">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Trip Features
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                  {featureCards.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => navigateToFeature(feature.path)}
                      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 sm:p-5 text-left transition-all hover:shadow-md hover:border-gray-300 touch-manipulation min-h-[80px] active:scale-[0.98]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${feature.color} text-white group-hover:scale-110 transition-transform flex-shrink-0`}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                            {feature.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <div className="xl:col-span-1">
            <MembersList
              members={trip.members}
              userRole={trip.userRole}
              currentUserId={user?.id || ''}
              onInviteMembers={handleInviteMembers}
              onManageMember={handleManageMember}
            />
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Invite Members</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowInviteModal(false)}
                    className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] touch-manipulation"
                  >
                    ×
                  </Button>
                </div>
                <InviteLink
                  tripId={trip.id}
                  isAdmin={trip.userRole === 'admin'}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDashboard;
