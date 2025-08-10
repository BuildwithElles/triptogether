/**
 * Error tracking and logging utilities
 * 
 * This module provides centralized error handling and logging functionality.
 * In production, this can be extended to integrate with error tracking services
 * like Sentry, LogRocket, or Bugsnag.
 */

export interface ErrorContext {
  userId?: string;
  tripId?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context?: ErrorContext;
  timestamp: Date;
  url: string;
  userAgent: string;
  sessionId: string;
}

// Generate a simple session ID for tracking errors in the same session
let sessionId: string;
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('error-session-id') || 
    Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('error-session-id', sessionId);
} else {
  sessionId = 'server-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Log an error to the console and potentially to external services
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorReport: ErrorReport = {
    error,
    context,
    timestamp: new Date(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    sessionId,
  };

  // Always log to console
  console.error('Error tracked:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: errorReport.timestamp.toISOString(),
    url: errorReport.url,
  });

  // In development, show more detailed information
  if (process.env.NODE_ENV === 'development') {
    console.group('🐛 Error Details');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Full Report:', errorReport);
    console.groupEnd();
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    sendToErrorService(errorReport).catch((serviceError) => {
      console.error('Failed to send error to tracking service:', serviceError);
    });
  }
}

/**
 * Send error to external tracking service
 * This is a placeholder - replace with your actual error tracking service
 */
async function sendToErrorService(errorReport: ErrorReport): Promise<void> {
  try {
    // Example: Send to your error tracking service
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: errorReport.error.message,
    //     stack: errorReport.error.stack,
    //     context: errorReport.context,
    //     timestamp: errorReport.timestamp.toISOString(),
    //     url: errorReport.url,
    //     userAgent: errorReport.userAgent,
    //     sessionId: errorReport.sessionId,
    //   }),
    // });

    // For now, just log that we would send it
    console.log('Would send error to tracking service:', {
      message: errorReport.error.message,
      context: errorReport.context,
    });
  } catch (error) {
    console.error('Error tracking service failed:', error);
  }
}

/**
 * Wrap an async function to automatically track errors
 */
export function withErrorTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error;
    }
  };
}

/**
 * Wrap a sync function to automatically track errors
 */
export function withSyncErrorTracking<T extends any[], R>(
  fn: (...args: T) => R,
  context?: ErrorContext
) {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error;
    }
  };
}

/**
 * Track API errors with specific context
 */
export function logApiError(
  error: Error, 
  endpoint: string, 
  method: string = 'GET',
  context?: Omit<ErrorContext, 'action' | 'feature'>
): void {
  logError(error, {
    ...context,
    feature: 'api',
    action: `${method} ${endpoint}`,
    metadata: {
      endpoint,
      method,
    },
  });
}

/**
 * Track component errors with specific context
 */
export function logComponentError(
  error: Error,
  componentName: string,
  context?: Omit<ErrorContext, 'feature'>
): void {
  logError(error, {
    ...context,
    feature: 'component',
    metadata: {
      component: componentName,
      ...context?.metadata,
    },
  });
}

/**
 * Track authentication errors
 */
export function logAuthError(
  error: Error,
  action: string,
  context?: Omit<ErrorContext, 'feature' | 'action'>
): void {
  logError(error, {
    ...context,
    feature: 'auth',
    action,
  });
}

/**
 * Track database/Supabase errors
 */
export function logDatabaseError(
  error: Error,
  operation: string,
  table?: string,
  context?: Omit<ErrorContext, 'feature' | 'action'>
): void {
  logError(error, {
    ...context,
    feature: 'database',
    action: operation,
    metadata: {
      table,
      ...context?.metadata,
    },
  });
}

/**
 * Create an error boundary error handler
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: any) => {
    logComponentError(error, componentName, {
      metadata: {
        errorInfo: errorInfo?.componentStack,
      },
    });
  };
}
