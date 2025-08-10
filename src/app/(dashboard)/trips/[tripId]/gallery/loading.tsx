'use client';

import React from 'react';
import { PhotoSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip gallery
 */
export default function GalleryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <PhotoSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
