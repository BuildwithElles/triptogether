'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTrips } from '@/lib/hooks/useTrips';
import { TripList } from '@/components/dashboard/TripList';
import { CreateTripForm } from '@/components/dashboard/CreateTripForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { PlusIcon, ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { trips, isLoading: tripsLoading, error, refetch } = useTrips();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleTripClick = (tripId: string) => {
    // Navigate to trip detail page - will be implemented in Task 20
    router.push(`/dashboard/trips/${tripId}`);
  };

  const handleCreateTrip = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (tripId: string) => {
    setShowCreateForm(false);
    // Refresh the trips list to show the new trip
    refetch();
    // Navigate to the new trip
    router.push(`/dashboard/trips/${tripId}`);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show create trip form
  if (showCreateForm) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Create Trip Form */}
        <CreateTripForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome back, {user?.user_metadata?.name || 'there'}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Plan your next adventure or manage your existing trips
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button onClick={handleCreateTrip} className="inline-flex items-center w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>
        </div>
      </div>

      {/* Trip List */}
      <TripList
        trips={trips}
        isLoading={tripsLoading}
        error={error}
        onTripClick={handleTripClick}
        onCreateTrip={handleCreateTrip}
        showCreateButton={true}
      />

      {/* Refresh Button for Development */}
      {error && (
        <div className="text-center">
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
