'use client';

import React from 'react';
import { ListSkeleton, PackingItemSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip packing list
 */
export default function PackingLoading() {
  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Category tabs */}
      <div className="flex space-x-4 overflow-x-auto">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0" />
        ))}
      </div>

      {/* Packing items */}
      <ListSkeleton 
        itemCount={8}
        renderItem={() => <PackingItemSkeleton />}
      />
    </div>
  );
}
