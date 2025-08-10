/**
 * Performance monitoring hook for TripTogether
 */

import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function usePerformance(componentName: string) {
  const measureRender = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
        }
        
        // Report to analytics in production (if needed)
        if (process.env.NODE_ENV === 'production' && renderTime > 100) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
    return () => {};
  }, [componentName]);

  const reportWebVitals = useCallback((metric: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital - ${metric.name}: ${metric.value}`);
    }
  }, []);

  useEffect(() => {
    // Monitor memory usage
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo && process.env.NODE_ENV === 'development') {
        console.log(`Memory usage in ${componentName}:`, {
          used: Math.round(memoryInfo.usedJSHeapSize / 1048576),
          total: Math.round(memoryInfo.totalJSHeapSize / 1048576),
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576),
        });
      }
    }
  }, [componentName]);

  return {
    measureRender,
    reportWebVitals,
  };
}
