// Utility functions to improve canvas rendering smoothness

// Debounce function to reduce unnecessary renders
export function debounce<F extends (...args: any[]) => any>(func: F, waitMilliseconds = 50): F {
    let timeoutId: number | null = null;
    
    return function(this: any, ...args: Parameters<F>) {
      const context = this;
      
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        func.apply(context, args);
      }, waitMilliseconds);
    } as F;
  }
  
  // Smooth interpolation between two values
  export function smoothInterpolate(
    from: number, 
    to: number, 
    progress: number, 
    easingFn: (t: number) => number = (t) => t
  ): number {
    const easedProgress = easingFn(progress);
    return from + (to - from) * easedProgress;
  }
  
  // Easing functions for smoother animations
  export const Easing = {
    // Linear interpolation (no easing)
    linear: (t: number) => t,
    
    // Quadratic ease in
    easeInQuad: (t: number) => t * t,
    
    // Quadratic ease out
    easeOutQuad: (t: number) => t * (2 - t),
    
    // Cubic ease in
    easeInCubic: (t: number) => t * t * t,
    
    // Cubic ease out
    easeOutCubic: (t: number) => {
      const t1 = t - 1;
      return 1 + t1 * t1 * t1;
    }
  };
  
  // Enhanced requestAnimationFrame wrapper with better performance
  export function smoothAnimation(
    duration: number, 
    updateFn: (progress: number) => void, 
    completeFn?: () => void
  ): () => void {
    const startTime = performance.now();
    
    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      updateFn(progress);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else if (completeFn) {
        completeFn();
      }
    }
    
    const animationFrame = requestAnimationFrame(update);
    
    // Return a cancellation function
    return () => cancelAnimationFrame(animationFrame);
  }