/**
 * Performance monitoring utilities
 */

// Track component render times
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    
    // Report to analytics in production
    if (process.env.NODE_ENV === 'production' && renderTime > 100) {
      // Log slow renders (>100ms)
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  };
};

// Track API call performance
export const measureApiCall = async <T>(
  apiCall: () => Promise<T>,
  apiName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`API ${apiName} took: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`API ${apiName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if ('PerformanceObserver' in window) {
    // Track Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Track Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      }
      console.log('CLS Score:', clsScore);
    });
    
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
};

// Bundle loading performance
export const trackChunkLoading = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsChunks = resources.filter(resource => 
          resource.name.includes('chunk') && resource.name.endsWith('.js')
        );
        
        jsChunks.forEach(chunk => {
          console.log(`Chunk ${chunk.name} loaded in ${chunk.duration.toFixed(2)}ms`);
        });
      }, 1000);
    });
  }
};
