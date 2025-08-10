export type { Trip } from '@/components/dashboard/TripList';

import { useState, useEffect, useCallback } from 'react';
import { mutate } from 'swr';
import type { Trip } from '@/components/dashboard/TripList';

// API response types
interface TripsResponse {
  trips: Trip[];
  total: number;
  offset: number;
  limit: number;
}

interface CreateTripData {
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetTotal?: number;
  maxMembers?: number;
  isPublic?: boolean;
}

interface CreateTripResponse {
  success: boolean;
  trip?: Trip;
  error?: string;
}

interface UseTripsResult {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCreateTripResult {
  createTrip: (data: CreateTripData) => Promise<CreateTripResponse>;
  isLoading: boolean;
  error: string | null;
}

// Fetch trips from API
const fetchTrips = async (status?: string): Promise<TripsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const response = await fetch(`/api/trips?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Create trip via API
const createTripAPI = async (data: CreateTripData): Promise<{ message: string; trip: Trip }> => {
  const response = await fetch('/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Hook for fetching trips
export function useTrips(status?: string): UseTripsResult {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTripsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchTrips(status);
      setTrips(response.trips);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchTripsData();
  }, [fetchTripsData]);

  const refetch = useCallback(() => {
    fetchTripsData();
  }, [fetchTripsData]);

  return {
    trips,
    isLoading,
    error,
    refetch,
  };
}

// Hook for creating trips with optimistic updates
export function useCreateTrip(): UseCreateTripResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTrip = useCallback(async (data: CreateTripData): Promise<CreateTripResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      // Create optimistic trip object
      const optimisticTrip: Trip = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: data.title,
        description: data.description,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        memberCount: 1, // Creator starts as the only member
        status: 'planning'
      };

      // Optimistically update the trips cache
      mutate('/api/trips', (currentData: TripsResponse | undefined) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          trips: [optimisticTrip, ...currentData.trips],
          total: currentData.total + 1
        };
      }, false); // Don't revalidate immediately

      const response = await createTripAPI(data);
      
      // Update with real data from server
      mutate('/api/trips');
      
      return {
        success: true,
        trip: response.trip,
      };
    } catch (err) {
      console.error('Error creating trip:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip';
      setError(errorMessage);
      
      // Revert optimistic update on error
      mutate('/api/trips');
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createTrip,
    isLoading,
    error,
  };
}
