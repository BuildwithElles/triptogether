import { useState, useCallback, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { supabase } from '@/lib/supabase/client';
import { ItineraryItem, ItineraryItemInsert, ItineraryItemUpdate } from '@/lib/types/database';

interface ItineraryItemWithUser extends ItineraryItem {
  created_by_user?: {
    id: string;
    email: string;
    raw_user_meta_data?: any;
  };
}

interface UseItineraryReturn {
  items: ItineraryItemWithUser[];
  isLoading: boolean;
  error: any;
  addItem: (item: Omit<ItineraryItemInsert, 'trip_id' | 'created_by'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ItineraryItemUpdate>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  mutate: () => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch itinerary items');
  }
  const data = await response.json();
  return data.items;
};

export function useItinerary(tripId: string): UseItineraryReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    data: items = [], 
    error, 
    mutate: mutateItems 
  } = useSWR<ItineraryItemWithUser[]>(
    tripId ? `/api/trips/${tripId}/itinerary` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Set up realtime subscription for itinerary items
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`itinerary-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'itinerary_items',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Revalidate data when any change occurs
          mutateItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, mutateItems]);

  const addItem = useCallback(async (itemData: Omit<ItineraryItemInsert, 'trip_id' | 'created_by'>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add itinerary item');
      }

      // Revalidate the data
      await mutateItems();
    } catch (error) {
      console.error('Error adding itinerary item:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [tripId, isSubmitting, mutateItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<ItineraryItemUpdate>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update itinerary item');
      }

      // Revalidate the data
      await mutateItems();
    } catch (error) {
      console.error('Error updating itinerary item:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [tripId, isSubmitting, mutateItems]);

  const deleteItem = useCallback(async (id: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/itinerary?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete itinerary item');
      }

      // Revalidate the data
      await mutateItems();
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [tripId, isSubmitting, mutateItems]);

  return {
    items,
    isLoading: !error && !items,
    error,
    addItem,
    updateItem,
    deleteItem,
    mutate: mutateItems,
  };
}

// Common itinerary categories
export const ITINERARY_CATEGORIES_LIST = [
  'Transportation',
  'Accommodation',
  'Activity',
  'Dining',
  'Sightseeing',
  'Meeting',
  'Other',
] as const;

export type ItineraryCategory = typeof ITINERARY_CATEGORIES_LIST[number];
