'use client';

import React from 'react';
import { OutfitSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip outfits
 */
export default function OutfitsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* View toggle */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Calendar/Grid view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <OutfitSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
