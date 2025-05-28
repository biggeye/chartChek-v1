import { 
  TransformationMetric, 
  TransformationStatistics, 
  TransformationAggregates,
  ModelCoverage,
  DateRange 
} from './types';

/**
 * Collects transformation metrics
 * @param metric - The transformation metric to collect
 */
export async function collectTransformationMetric(metric: TransformationMetric): Promise<void> {
  try {
    await fetch('/api/dev/transformations/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  } catch (error) {
    // Silent fail for metrics collection
    console.warn('[TransformationMonitoring] Failed to collect metric:', error);
  }
}

/**
 * Calculates aggregates for a set of metrics
 */
function calculateAggregates(metrics: TransformationMetric[]): TransformationAggregates {
  const successful = metrics.filter(m => m.success).length;
  const failed = metrics.length - successful;
  
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  const averageDuration = metrics.length > 0 ? totalDuration / metrics.length : 0;

  const errorTypes: Record<string, number> = {};
  metrics.filter(m => !m.success).forEach(m => {
    if (m.errorType) {
      errorTypes[m.errorType] = (errorTypes[m.errorType] || 0) + 1;
    }
  });

  return {
    total: metrics.length,
    successful,
    failed,
    averageDuration,
    errorTypes
  };
}

/**
 * Calculates model coverage statistics
 */
async function calculateModelCoverage(): Promise<{
  models: ModelCoverage[];
  overall: number;
}> {
  try {
    const response = await fetch('/api/dev/transformations/coverage');
    const coverage = await response.json();
    return coverage;
  } catch (error) {
    console.error('[TransformationMonitoring] Failed to fetch coverage:', error);
    return {
      models: [],
      overall: 0
    };
  }
}

/**
 * Gets transformation statistics for monitoring
 */
export async function getTransformationStatistics(dateRange: DateRange): Promise<TransformationStatistics> {
  try {
    // Fetch metrics for each time period
    const [dailyMetrics, weeklyMetrics, monthlyMetrics] = await Promise.all([
      fetch(`/api/dev/transformations/metrics?start=${dateRange.daily.start}&end=${dateRange.daily.end}`),
      fetch(`/api/dev/transformations/metrics?start=${dateRange.weekly.start}&end=${dateRange.weekly.end}`),
      fetch(`/api/dev/transformations/metrics?start=${dateRange.monthly.start}&end=${dateRange.monthly.end}`)
    ]);

    const [daily, weekly, monthly] = await Promise.all([
      dailyMetrics.json(),
      weeklyMetrics.json(),
      monthlyMetrics.json()
    ]);

    // Get model coverage
    const coverage = await calculateModelCoverage();

    // Get recent errors
    const recentErrorsResponse = await fetch('/api/dev/transformations/errors');
    const recentErrors = await recentErrorsResponse.json();

    return {
      metrics: {
        daily: calculateAggregates(daily),
        weekly: calculateAggregates(weekly),
        monthly: calculateAggregates(monthly)
      },
      coverage,
      recentErrors
    };
  } catch (error) {
    console.error('[TransformationMonitoring] Error calculating transformation statistics:', error);
    throw error;
  }
}

/**
 * Helper to wrap transformation functions with monitoring
 */
export function withTransformationMonitoring<T, U>(
  transformFn: (data: T) => U,
  targetModel: string
): (data: T) => U {
  return (data: T) => {
    const startTime = performance.now();
    try {
      const result = transformFn(data);
      const duration = performance.now() - startTime;
      
      // Collect success metric
      collectTransformationMetric({
        id: crypto.randomUUID(),
        source: 'KIPU',
        targetModel,
        timestamp: new Date().toISOString(),
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Collect error metric
      collectTransformationMetric({
        id: crypto.randomUUID(),
        source: 'KIPU',
        targetModel,
        timestamp: new Date().toISOString(),
        duration,
        success: false,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  };
} 