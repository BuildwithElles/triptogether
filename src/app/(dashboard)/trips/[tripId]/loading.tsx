'use client';

import React from 'react';
import { PageSkeleton } from '@/components/common/SkeletonComponents';

/**
 * Loading page for individual trip pages
 * Shows skeleton layout for trip dashboard with tabs
 */
export default function TripLoading() {
  return (
    <PageSkeleton 
      showHeader={true} 
      showTabs={true}
      className="max-w-7xl mx-auto"
    />
  );
}
