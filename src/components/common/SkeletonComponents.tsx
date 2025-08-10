'use client';

import React from 'react';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Skeleton component for trip cards in the dashboard
 */
export function TripCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-6 space-y-4 bg-white ${className}`}>
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

/**
 * Skeleton for trip header component
 */
export function TripHeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for itinerary items
 */
export function ItineraryItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 space-y-3 bg-white ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

/**
 * Skeleton for budget items
 */
export function BudgetItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 space-y-3 bg-white ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton for packing items
 */
export function PackingItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white ${className}`}>
      <Skeleton className="h-5 w-5" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

/**
 * Skeleton for chat messages
 */
export function ChatMessageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="ml-10">
        <Skeleton className="h-4 w-64 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

/**
 * Skeleton for photo gallery items
 */
export function PhotoSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`aspect-square bg-gray-200 rounded-lg animate-pulse ${className}`}>
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

/**
 * Skeleton for outfit items
 */
export function OutfitSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 space-y-3 bg-white ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="aspect-video bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Skeleton for member list items
 */
export function MemberSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 p-3 ${className}`}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  );
}

/**
 * Generic list skeleton that can be reused
 */
export function ListSkeleton({ 
  itemCount = 5, 
  renderItem,
  className = '' 
}: { 
  itemCount?: number;
  renderItem?: () => React.ReactNode;
  className?: string;
}) {
  const defaultItem = () => (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2 bg-white">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i}>
          {renderItem ? renderItem() : defaultItem()}
        </div>
      ))}
    </div>
  );
}

/**
 * Page skeleton with header and content areas
 */
export function PageSkeleton({ 
  showHeader = true,
  showTabs = false,
  className = '' 
}: { 
  showHeader?: boolean;
  showTabs?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && <TripHeaderSkeleton />}
      
      {showTabs && (
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <ListSkeleton itemCount={4} />
      </div>
    </div>
  );
}
