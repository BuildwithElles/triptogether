'use client';

import React from 'react';
import { ListSkeleton, BudgetItemSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip budget
 */
export default function BudgetLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Budget summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Budget items */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <ListSkeleton 
          itemCount={6}
          renderItem={() => <BudgetItemSkeleton />}
        />
      </div>
    </div>
  );
}
