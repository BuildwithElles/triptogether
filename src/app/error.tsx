'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    // Log the error to console for development
    console.error('Global error caught:', error);
    
    // In production, you could send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. This has been logged and we&apos;ll look into it.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="text-left bg-gray-100 rounded p-3 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Error details:</p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-1">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={reset}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button 
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
