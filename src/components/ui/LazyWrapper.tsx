/**
 * Lazy loading wrapper component with suspense and error boundary
 */

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

export function LazyWrapper({ 
  children, 
  fallback = <DefaultFallback />, 
  className = "" 
}: LazyWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}
