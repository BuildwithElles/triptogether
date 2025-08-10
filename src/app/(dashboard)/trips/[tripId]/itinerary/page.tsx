'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { AddItineraryItem } from '@/components/itinerary/AddItineraryItem';
import { TripProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
  };

  const handleEditItem = (itemId: string) => {
    setEditingItemId(itemId);
    // TODO: Implement edit functionality in a future enhancement
    console.log('Edit item:', itemId);
  };

  return (
    <TripProtectedRoute tripId={tripId}>
      <div className="container mx-auto py-4 lg:py-6 px-3 sm:px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trip Itinerary</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Plan and organize your trip activities</p>
              </div>
            </div>
            
            {!showAddForm && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="mb-4 lg:mb-6">
            <AddItineraryItem
              tripId={tripId}
              onSuccess={handleAddSuccess}
              onCancel={handleAddCancel}
              isInline={true}
            />
          </div>
        )}

        {/* Itinerary List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Itinerary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItineraryList 
              tripId={tripId} 
              onEditItem={handleEditItem}
            />
          </CardContent>
        </Card>

        {/* TODO: Future enhancements */}
        {/* - Edit functionality for items */}
        {/* - Drag and drop reordering */}
        {/* - Calendar view */}
        {/* - Export to calendar apps */}
        {/* - Weather integration */}
        {/* - Map integration */}
      </div>
    </TripProtectedRoute>
  );
}
