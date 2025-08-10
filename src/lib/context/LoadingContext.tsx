'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Loading provider to manage global loading states
 * Useful for coordinating loading states across components
 */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => {
      if (isLoading) {
        return { ...prev, [key]: true };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  const isLoading = useCallback((key: string) => {
    return !!loadingStates[key];
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      isAnyLoading,
      clearAllLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to use loading context
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

/**
 * Hook for managing individual component loading states
 */
export function useComponentLoading(componentKey: string) {
  const { setLoading, isLoading } = useLoading();

  const startLoading = useCallback(() => {
    setLoading(componentKey, true);
  }, [componentKey, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(componentKey, false);
  }, [componentKey, setLoading]);

  const withLoading = useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    startLoading();
    try {
      return await asyncFn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading: isLoading(componentKey),
    startLoading,
    stopLoading,
    withLoading
  };
}
