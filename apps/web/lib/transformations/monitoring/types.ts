export interface TransformationMetric {
  id: string;
  source: 'KIPU';  // Extensible for future EMRs
  targetModel: string;
  timestamp: string;
  duration: number;  // in milliseconds
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface TransformationAggregates {
  total: number;
  successful: number;
  failed: number;
  averageDuration: number;
  errorTypes: Record<string, number>;
}

export interface ModelCoverage {
  model: string;
  totalFields: number;
  transformedFields: number;
  coverage: number;
  missingFields: string[];
}

export interface DateRange {
  daily: {
    start: string;
    end: string;
  };
  weekly: {
    start: string;
    end: string;
  };
  monthly: {
    start: string;
    end: string;
  };
}

export interface TransformationStatistics {
  metrics: {
    daily: TransformationAggregates;
    weekly: TransformationAggregates;
    monthly: TransformationAggregates;
  };
  coverage: {
    models: ModelCoverage[];
    overall: number;
  };
  recentErrors: TransformationMetric[];
} 