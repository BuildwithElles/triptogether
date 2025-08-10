'use client';

import React from 'react';
import { TripCard } from './TripCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { PlusIcon, MapIcon, AlertCircleIcon } from 'lucide-react';

export interface Trip {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
}

interface TripListProps {
  trips?: Trip[];
  isLoading?: boolean;
  error?: string | null;
  onTripClick?: (tripId: string) => void;
  onCreateTrip?: () => void;
  className?: string;
  showCreateButton?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function TripList({
  trips = [],
  isLoading = false,
  error = null,
  onTripClick,
  onCreateTrip,
  className = '',
  showCreateButton = true,
  emptyStateTitle = "No trips yet",
  emptyStateDescription = "Create your first trip to start planning your next adventure"
}: TripListProps) {

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <EmptyState
          icon={AlertCircleIcon}
          title="Error loading trips"
          description={error}
          action={
            showCreateButton && onCreateTrip ? (
              <Button onClick={onCreateTrip} variant="outline" className="mt-4">
                Try creating a new trip
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Empty state
  if (trips.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <EmptyState
          icon={MapIcon}
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={
            showCreateButton && onCreateTrip ? (
              <Button onClick={onCreateTrip} className="mt-4">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Trip
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Group trips by status for better organization
  const groupedTrips = trips.reduce((acc, trip) => {
    const status = trip.status || 'planning';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  const statusOrder = ['active', 'planning', 'completed', 'cancelled'];
  const statusLabels = {
    active: 'Active Trips',
    planning: 'Upcoming Trips',
    completed: 'Completed Trips',
    cancelled: 'Cancelled Trips'
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with trip count */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900">Your Trips</h2>
          <p className="text-sm text-gray-500 mt-1">
            {trips.length} trip{trips.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {showCreateButton && onCreateTrip && (
          <div className="flex-shrink-0">
            <Button 
              onClick={onCreateTrip} 
              className="hidden sm:inline-flex min-h-[44px] touch-manipulation"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>
        )}
      </div>

      {/* Trip sections by status */}
      {statusOrder.map(status => {
        const statusTrips = groupedTrips[status];
        if (!statusTrips || statusTrips.length === 0) return null;

        return (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-700">
                {statusLabels[status as keyof typeof statusLabels]}
              </h3>
              <span className="text-sm text-gray-500">
                {statusTrips.length} trip{statusTrips.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Responsive grid layout */}
            <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {statusTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={onTripClick}
                  className="h-full"
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Mobile create button */}
      {showCreateButton && onCreateTrip && (
        <div className="sm:hidden">
          <Button 
            onClick={onCreateTrip} 
            className="w-full min-h-[48px] touch-manipulation text-base font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Trip
          </Button>
        </div>
      )}
    </div>
  );
}
