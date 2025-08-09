'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowRightIcon } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
}

interface TripCardProps {
  trip: Trip;
  onClick?: (tripId: string) => void;
  className?: string;
}

export function TripCard({ trip, onClick, className }: TripCardProps) {
  const handleClick = () => {
    onClick?.(trip.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(trip.id);
    }
  };

  // Format dates
  const startDate = trip.startDate ? new Date(trip.startDate) : null;
  const endDate = trip.endDate ? new Date(trip.endDate) : null;
  const now = new Date();

  // Determine trip status based on dates
  const getTripStatus = () => {
    if (trip.status) return trip.status;
    
    if (!startDate || !endDate) return 'planning';
    
    if (isBefore(now, startDate)) return 'planning';
    if (isAfter(now, endDate)) return 'completed';
    return 'active';
  };

  const status = getTripStatus();

  const getStatusBadge = () => {
    const statusConfig = {
      planning: { label: 'Planning', variant: 'secondary' as const },
      active: { label: 'Active', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
    };

    const config = statusConfig[status] || statusConfig.planning;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateRange = () => {
    if (!startDate) return null;
    
    if (!endDate) {
      return format(startDate, 'MMM d, yyyy');
    }

    if (startDate.getFullYear() === endDate.getFullYear()) {
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
      }
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }

    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group ${className || ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for trip to ${trip.destination || trip.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 ml-3">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="space-y-2">
          {trip.destination && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{trip.destination}</span>
            </div>
          )}

          {startDate && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatDateRange()}</span>
            </div>
          )}

          {trip.memberCount && (
            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {trip.memberCount} member{trip.memberCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            Click to view details
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>
      </CardFooter>
    </Card>
  );
}