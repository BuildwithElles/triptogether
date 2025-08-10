'use client';

import React from 'react';
import { LoadingSpinner, Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for dashboard routes
 * Provides a skeleton layout that matches the dashboard structure
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex-shrink-0">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Trip list skeleton */}
      <div className="space-y-8">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-10 w-32 hidden sm:block" />
        </div>

        {/* Trip cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <span className="text-sm text-gray-600">Loading your trips...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton component for trip cards
 */
function TripCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
