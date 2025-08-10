'use client';

import React from 'react';
import { ListSkeleton, ItineraryItemSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip itinerary
 */
export default function ItineraryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Itinerary items */}
      <ListSkeleton 
        itemCount={5}
        renderItem={() => <ItineraryItemSkeleton />}
      />
    </div>
  );
}
