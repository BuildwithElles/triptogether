'use client';

import React from 'react';

interface Trip {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
}

interface TripCardProps {
  trip: Trip;
  onClick?: (tripId: string) => void;
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const handleClick = () => {
    onClick?.(trip.id);
  };

  return (
    <div
      className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
      data-testid="trip-card"
    >
      <h3 className="text-lg font-semibold text-gray-900" data-testid="trip-title">
        {trip.title}
      </h3>
      {trip.description && (
        <p className="mt-2 text-sm text-gray-600">{trip.description}</p>
      )}
      {trip.destination && (
        <p className="mt-1 text-sm text-gray-500">📍 {trip.destination}</p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        {trip.startDate && trip.endDate && (
          <span>
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </span>
        )}
        {trip.memberCount && (
          <span>{trip.memberCount} member{trip.memberCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}