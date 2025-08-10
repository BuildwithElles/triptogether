/**
 * Gallery page for trip photos
 * Displays uploaded photos in a responsive grid with upload functionality
 */

import { Suspense } from 'react';
import { PhotoGallery } from '@/components/gallery/PhotoGallery';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface GalleryPageProps {
  params: {
    tripId: string;
  };
}

export default function GalleryPage({ params }: GalleryPageProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
        <p className="text-gray-600 mt-1">
          Upload and share photos from your trip
        </p>
      </div>

      {/* Gallery Content */}
      <Suspense 
        fallback={
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <PhotoGallery tripId={params.tripId} />
      </Suspense>
    </div>
  );
}
