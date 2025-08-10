/**
 * useOutfits Hook
 * Custom hook for managing trip outfits with CRUD operations
 */

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { OutfitItem, OutfitItemInsert, OutfitItemUpdate, ClothingItem } from '../types/database';
import { useAuth } from './useAuth';

interface UseOutfitsOptions {
  tripId: string;
  dateFilter?: string; // ISO date string
}

interface OutfitWithUser extends OutfitItem {
  user_name?: string;
  user_email?: string;
}

interface OutfitStats {
  total: number;
  planned: number;
  worn: number;
  favorites: number;
}

interface CreateOutfitData {
  name: string;
  description?: string;
  occasion?: string;
  weather?: string;
  date_planned?: string;
  clothing_items?: ClothingItem[];
  image_url?: string;
}

interface UpdateOutfitData {
  name?: string;
  description?: string;
  occasion?: string;
  weather?: string;
  date_planned?: string;
  clothing_items?: ClothingItem[];
  image_url?: string;
  is_worn?: boolean;
  is_favorite?: boolean;
}

export function useOutfits({ tripId, dateFilter }: UseOutfitsOptions) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(dateFilter || null);

  // Construct API URL with optional date filter
  const apiUrl = `/api/trips/${tripId}/outfits${selectedDate ? `?date=${selectedDate}` : ''}`;

  // Fetch outfits
  const {
    data: outfits = [],
    error: fetchError,
    isLoading: isFetching,
    mutate,
  } = useSWR<OutfitWithUser[]>(apiUrl);

  // Calculate stats
  const stats: OutfitStats = {
    total: outfits.length,
    planned: outfits.filter(outfit => outfit.date_planned).length,
    worn: outfits.filter(outfit => outfit.is_worn).length,
    favorites: outfits.filter(outfit => outfit.is_favorite).length,
  };

  /**
   * Create a new outfit
   */
  const createOutfit = useCallback(
    async (outfitData: CreateOutfitData): Promise<OutfitItem> => {
      if (!user) {
        throw new Error('Must be logged in to create outfits');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trips/${tripId}/outfits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outfitData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create outfit');
        }

        const { outfit } = await response.json();

        // Revalidate data
        await mutate();

        return outfit;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create outfit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, tripId, mutate]
  );

  /**
   * Update an existing outfit
   */
  const updateOutfit = useCallback(
    async (outfitId: string, updates: UpdateOutfitData): Promise<OutfitItem> => {
      if (!user) {
        throw new Error('Must be logged in to update outfits');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trips/${tripId}/outfits/${outfitId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update outfit');
        }

        const { outfit } = await response.json();

        // Revalidate data
        await mutate();

        return outfit;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update outfit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, tripId, mutate]
  );

  /**
   * Delete an outfit
   */
  const deleteOutfit = useCallback(
    async (outfitId: string): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to delete outfits');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trips/${tripId}/outfits/${outfitId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete outfit');
        }

        // Revalidate data
        await mutate();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete outfit';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, tripId, mutate]
  );

  /**
   * Toggle outfit as favorite
   */
  const toggleFavorite = useCallback(
    async (outfitId: string, isFavorite: boolean): Promise<void> => {
      await updateOutfit(outfitId, { is_favorite: isFavorite });
    },
    [updateOutfit]
  );

  /**
   * Mark outfit as worn/unworn
   */
  const toggleWorn = useCallback(
    async (outfitId: string, isWorn: boolean): Promise<void> => {
      await updateOutfit(outfitId, { is_worn: isWorn });
    },
    [updateOutfit]
  );

  /**
   * Get outfits for a specific date
   */
  const getOutfitsForDate = useCallback(
    (date: string): OutfitWithUser[] => {
      return outfits.filter(outfit => outfit.date_planned === date);
    },
    [outfits]
  );

  /**
   * Get unique occasions from all outfits
   */
  const getOccasions = useCallback((): string[] => {
    const occasions = new Set(outfits.map(outfit => outfit.occasion).filter(Boolean));
    return Array.from(occasions);
  }, [outfits]);

  /**
   * Get outfits by occasion
   */
  const getOutfitsByOccasion = useCallback(
    (occasion: string): OutfitWithUser[] => {
      return outfits.filter(outfit => outfit.occasion === occasion);
    },
    [outfits]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    outfits,
    stats,
    
    // State
    isLoading: isLoading || isFetching,
    error: error || fetchError?.message,
    selectedDate,
    
    // Actions
    createOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    toggleWorn,
    
    // Utilities
    getOutfitsForDate,
    getOccasions,
    getOutfitsByOccasion,
    setSelectedDate,
    clearError,
    refresh: mutate,
  };
}
