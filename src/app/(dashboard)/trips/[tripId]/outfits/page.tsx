/**
 * Outfits Page
 * Displays and manages outfits for a trip with calendar view and CRUD operations
 */

import { Suspense } from 'react';
import { OutfitPlanner } from '@/components/outfits';
import { LoadingSpinner } from '@/components/common';

interface OutfitsPageProps {
  params: {
    tripId: string;
  };
}

export default function OutfitsPage({ params }: OutfitsPageProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outfit Planner</h1>
          <p className="mt-2 text-gray-600">
            Plan your outfits for each day of your trip and get weather-based recommendations.
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <OutfitPlanner tripId={params.tripId} />
        </Suspense>
      </div>
    </div>
  );
}
