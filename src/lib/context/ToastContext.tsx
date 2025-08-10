'use client';

import React, { createContext, useContext } from 'react';
import { toast as baseToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface ToastContextType {
  toast: {
    success: (message: string, description?: string) => void;
    error: (message: string, description?: string) => void;
    info: (message: string, description?: string) => void;
    warning: (message: string, description?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ) => Promise<T>;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = {
    success: (message: string, description?: string) => {
      baseToast({
        title: message,
        description,
        variant: 'default',
        className: 'border-green-200 bg-green-50 text-green-900',
      });
    },

    error: (message: string, description?: string) => {
      baseToast({
        title: message,
        description,
        variant: 'destructive',
      });
    },

    info: (message: string, description?: string) => {
      baseToast({
        title: message,
        description,
        variant: 'default',
        className: 'border-blue-200 bg-blue-50 text-blue-900',
      });
    },

    warning: (message: string, description?: string) => {
      baseToast({
        title: message,
        description,
        variant: 'default',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
      });
    },

    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      // Show loading toast
      const loadingToast = baseToast({
        title: options.loading,
        variant: 'default',
        className: 'border-gray-200 bg-gray-50 text-gray-900',
      });

      try {
        const result = await promise;
        
        // Dismiss loading toast
        loadingToast.dismiss();
        
        // Show success toast
        const successMessage = typeof options.success === 'function' 
          ? options.success(result) 
          : options.success;
        
        baseToast({
          title: successMessage,
          variant: 'default',
          className: 'border-green-200 bg-green-50 text-green-900',
        });

        return result;
      } catch (error) {
        // Dismiss loading toast
        loadingToast.dismiss();
        
        // Show error toast
        const errorMessage = typeof options.error === 'function' 
          ? options.error(error as Error) 
          : options.error;
        
        baseToast({
          title: errorMessage,
          variant: 'destructive',
        });

        throw error;
      }
    },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

// Convenience exports for direct usage
export const showSuccess = (message: string, description?: string) => {
  baseToast({
    title: message,
    description,
    variant: 'default',
    className: 'border-green-200 bg-green-50 text-green-900',
  });
};

export const showError = (message: string, description?: string) => {
  baseToast({
    title: message,
    description,
    variant: 'destructive',
  });
};

export const showInfo = (message: string, description?: string) => {
  baseToast({
    title: message,
    description,
    variant: 'default',
    className: 'border-blue-200 bg-blue-50 text-blue-900',
  });
};

export const showWarning = (message: string, description?: string) => {
  baseToast({
    title: message,
    description,
    variant: 'default',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  });
};
