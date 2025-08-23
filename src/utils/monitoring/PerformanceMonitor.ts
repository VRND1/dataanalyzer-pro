import { DebugLogger } from './DebugLogger';

interface PerformanceMetrics {
  component: string;
  operation: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private logger = DebugLogger.getInstance();
  private readonly MAX_METRICS = 1000;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(component: string, operation: string): () => void {
    const start = performance.now();
    return () => this.endOperation(component, operation, start);
  }

  private endOperation(component: string, operation: string, startTime: number) {
    const duration = performance.now() - startTime;
    const metric: PerformanceMetrics = {
      component,
      operation,
      duration,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (duration > 1000) {
      this.logger.log('warn', component, `Slow operation: ${operation}`, {
        duration,
        timestamp: metric.timestamp
      });
    }
  }

  getMetrics(component?: string): PerformanceMetrics[] {
    return component
      ? this.metrics.filter(m => m.component === component)
      : this.metrics;
  }

  getAverageOperationTime(component: string, operation: string): number {
    const relevantMetrics = this.metrics.filter(
      m => m.component === component && m.operation === operation
    );
    
    if (relevantMetrics.length === 0) return 0;
    
    return relevantMetrics.reduce((sum, m) => sum + m.duration, 0) / relevantMetrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}