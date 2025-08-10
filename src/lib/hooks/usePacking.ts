import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'

// Types for packing items and API responses
export interface PackingItem {
  id: string
  name: string
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'medication' | 'accessories' | 'other'
  priority: 'low' | 'medium' | 'high'
  quantity: number
  is_packed: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface PackingStats {
  total: number
  packed: number
  unpacked: number
  completion: number
}

export interface PackingData {
  items: PackingItem[]
  stats: PackingStats
}

export interface CreatePackingItemData {
  name: string
  category: PackingItem['category']
  priority?: PackingItem['priority']
  quantity?: number
  notes?: string
}

export interface UpdatePackingItemData {
  name?: string
  category?: PackingItem['category']
  priority?: PackingItem['priority']
  quantity?: number
  notes?: string
  is_packed?: boolean
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<PackingData> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch packing items')
  }
  return response.json()
}

export function usePacking(tripId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SWR hook for fetching packing items
  const {
    data,
    error: fetchError,
    isLoading: isFetching,
    mutate: mutatePacking
  } = useSWR<PackingData>(
    tripId ? `/api/trips/${tripId}/packing` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  // Set up realtime subscription for packing items
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`packing-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'packing_items',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Revalidate data when any change occurs
          mutatePacking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, mutatePacking]);

  // Create a new packing item
  const createPackingItem = async (itemData: CreatePackingItemData): Promise<PackingItem> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/packing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create packing item')
      }

      const { item } = await response.json()

      // Optimistically update the cache
      await mutatePacking()

      return item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create packing item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Update an existing packing item
  const updatePackingItem = async (itemId: string, updateData: UpdatePackingItemData): Promise<PackingItem> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/packing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, ...updateData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update packing item')
      }

      const { item } = await response.json()

      // Optimistically update the cache
      await mutatePacking()

      return item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update packing item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a packing item
  const deletePackingItem = async (itemId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/packing?itemId=${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete packing item')
      }

      // Optimistically update the cache
      await mutatePacking()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete packing item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle packed status of an item
  const togglePackedStatus = async (itemId: string, currentStatus: boolean): Promise<PackingItem> => {
    return updatePackingItem(itemId, { is_packed: !currentStatus })
  }

  // Utility functions
  const getItemsByCategory = (category: PackingItem['category']): PackingItem[] => {
    return data?.items.filter(item => item.category === category) || []
  }

  const getItemsByPriority = (priority: PackingItem['priority']): PackingItem[] => {
    return data?.items.filter(item => item.priority === priority) || []
  }

  const getPackedItems = (): PackingItem[] => {
    return data?.items.filter(item => item.is_packed) || []
  }

  const getUnpackedItems = (): PackingItem[] => {
    return data?.items.filter(item => !item.is_packed) || []
  }

  // Refresh data
  const refresh = async () => {
    await mutatePacking()
  }

  return {
    // Data
    items: data?.items || [],
    stats: data?.stats || { total: 0, packed: 0, unpacked: 0, completion: 0 },
    
    // Loading states
    isLoading: isLoading || isFetching,
    isFetching,
    
    // Error states
    error: error || fetchError?.message,
    
    // Actions
    createPackingItem,
    updatePackingItem,
    deletePackingItem,
    togglePackedStatus,
    refresh,
    
    // Utility functions
    getItemsByCategory,
    getItemsByPriority,
    getPackedItems,
    getUnpackedItems,
  }
}
