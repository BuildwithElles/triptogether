'use client';

import React from 'react';
import { CalendarDays, MapPin, Users, Settings, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TripHeaderProps {
  trip: {
    id: string;
    title: string;
    description: string | null;
    destination: string;
    startDate: string;
    endDate: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    memberCount: number;
    userRole: 'admin' | 'guest';
    budgetTotal?: number | null;
  };
  onEdit?: () => void;
  onShare?: () => void;
}

const TripHeader: React.FC<TripHeaderProps> = ({ trip, onEdit, onShare }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    const start = formatDate(trip.startDate);
    const end = formatDate(trip.endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning':
        return 'secondary';
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'text-blue-600';
      case 'active':
        return 'text-green-600';
      case 'completed':
        return 'text-gray-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateTripDuration = () => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {trip.title}
              </h1>
              <Badge 
                variant={getStatusBadgeVariant(trip.status)}
                className={getStatusColor(trip.status)}
              >
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </Badge>
            </div>
            
            {trip.description && (
              <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>

          {/* Action buttons - only show for admins */}
          {trip.userRole === 'admin' && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Destination */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <MapPin className="h-5 w-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 mb-1">Destination</p>
              <p className="font-medium text-gray-900 truncate">{trip.destination}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 mb-1">Dates</p>
              <p className="font-medium text-gray-900 truncate">
                {formatDateRange()}
              </p>
              <p className="text-xs text-gray-500">
                {calculateTripDuration()}
              </p>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 mb-1">Members</p>
              <p className="font-medium text-gray-900">
                {trip.memberCount} {trip.memberCount === 1 ? 'member' : 'members'}
              </p>
              <p className="text-xs text-gray-500">
                You are {trip.userRole === 'admin' ? 'an admin' : 'a guest'}
              </p>
            </div>
          </div>
        </div>

        {/* Budget info - show if available */}
        {trip.budgetTotal && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Budget</span>
              <span className="font-semibold text-lg text-gray-900">
                ${trip.budgetTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripHeader;
