'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto flex items-center justify-center">
        {Icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        )}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoTripsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      title="No trips yet"
      description="Create your first trip to start planning your next adventure"
      action={
        onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Your First Trip
          </button>
        )
      }
    />
  );
}

export function NoResultsEmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      title="No results found"
      description={
        searchTerm
          ? `No trips match "${searchTerm}". Try adjusting your search.`
          : 'No trips match your current filters. Try adjusting your criteria.'
      }
    />
  );
}

export function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description="We couldn't load your trips. Please try again."
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )
      }
    />
  );
}
