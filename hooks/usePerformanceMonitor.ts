"use client";

import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    const metrics: PerformanceMetrics = {
      renderTime,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      timestamp: Date.now(),
    };

    metricsRef.current.push(metrics);

    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }

    if (renderTime > 16) {
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) {
      console.warn(
        `${componentName} memory usage: ${(
          metrics.memoryUsage /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    }
  });

  return {
    getMetrics: () => metricsRef.current,
    getAverageRenderTime: () => {
      const metrics = metricsRef.current;
      if (metrics.length === 0) return 0;
      return metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    },
    getLatestMetrics: () => metricsRef.current[metricsRef.current.length - 1],
  };
};
