'use client';

import { useEffect, useState } from 'react';
import { testClientConnection } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      const isConnected = await testClientConnection();
      setConnectionStatus(isConnected ? 'success' : 'failed');
      if (!isConnected) {
        setErrorMessage('Connection test failed. Check browser console for details.');
      }
    } catch (error) {
      setConnectionStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    // Auto-test connection on component mount
    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Testing client-side connection to Supabase backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'idle' ? 'bg-gray-400' :
              connectionStatus === 'testing' ? 'bg-yellow-400 animate-pulse' :
              connectionStatus === 'success' ? 'bg-green-400' :
              'bg-red-400'
            }`} />
            <span className="text-sm font-medium">
              {connectionStatus === 'idle' && 'Ready to test'}
              {connectionStatus === 'testing' && 'Testing connection...'}
              {connectionStatus === 'success' && 'Connection successful!'}
              {connectionStatus === 'failed' && 'Connection failed'}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {connectionStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ✅ Supabase client configuration is working correctly!
              </p>
            </div>
          )}

          <Button 
            onClick={testConnection} 
            disabled={connectionStatus === 'testing'}
            className="w-full"
          >
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Project:</strong> ydoliynzkolkpfjxzpxv</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
