// Evaluation types for metrics and deficiency tracking

export interface EvaluationMetric {
  id: string;
  name: string;
  status: 'completed' | 'inProgress' | 'readyForReview' | 'inUse' | 'pending';
  type: 'admission' | 'daily' | 'cyclic';
  expectedDate: string;
  completedDate: string | null;
  category: string;
}

export interface EvaluationMetricsCollection {
  assessments: EvaluationMetric[];
  screenings: EvaluationMetric[];
  treatmentPlans: EvaluationMetric[];
  consents: EvaluationMetric[];
  administrative: EvaluationMetric[];
  medical: EvaluationMetric[];
  other: EvaluationMetric[];
  statusCounts: {
    completed: number;
    inProgress: number;
    readyForReview: number;
    inUse: number;
  };
}

// Evaluation category mapping
export const EVALUATION_CATEGORIES: Record<string, string> = {
  // Assessments
  "pre-admission assessment": "assessments",
  "locus assessment with scoring": "assessments",
  "bio-psychosocial assessment": "assessments",
  "trauma assessment": "assessments",
  "social risk assessment": "assessments",
  "educational learning assessment": "assessments",
  "legal assessment": "assessments",
  "spiritual assessment": "assessments",
  "fagerstrom test for nicotine dependence": "assessments",
  "columbia-suicide severity rating scale": "assessments",
  
  // Screenings
  "screen - nutritional": "screenings",
  "screen - pain": "screenings",
  "tuberculosis skin testing questionnaire": "screenings",
  
  // Treatment Plans
  "problem list": "treatmentPlans",
  "clinical individualized treatment plan": "treatmentPlans",
  "initial aftercare plan": "treatmentPlans",
  "utilization review": "treatmentPlans",
  
  // Consents
  "medications informed consent": "consents",
  "self preservation statement": "consents",
  
  // Administrative
  "belongings placed in the safe": "administrative",
  "safe call": "administrative",
  "attachment pulled chart": "administrative",
  
  // Medical
  "initial psychiatric evaluation": "medical",
  "history and physical exam": "medical"
};

// Normalize evaluation name for consistent categorization
export function normalizeEvaluationName(name: string): string {
  return name.trim().toLowerCase();
}

// Determine category based on normalized name
export function getEvaluationCategory(normalizedName: string): string {
  // Check for exact matches first
  if (EVALUATION_CATEGORIES[normalizedName]) {
    return EVALUATION_CATEGORIES[normalizedName];
  }
  
  // Check for partial matches
  for (const [key, category] of Object.entries(EVALUATION_CATEGORIES)) {
    if (normalizedName.includes(key)) {
      return category;
    }
  }
  
  // Default category
  return "other";
}

// Parse raw evaluations into categorized metrics collection
export function parseEvaluations(evaluations: any[]): EvaluationMetricsCollection {
  const result: EvaluationMetricsCollection = {
    assessments: [],
    screenings: [],
    treatmentPlans: [],
    consents: [],
    administrative: [],
    medical: [],
    other: [],
    statusCounts: {
      completed: 0,
      inProgress: 0,
      readyForReview: 0,
      inUse: 0
    }
  };
  
  evaluations.forEach(evaluation => {
    const normalizedName = normalizeEvaluationName(evaluation.name);
    const category = getEvaluationCategory(normalizedName);
    
    const metric: EvaluationMetric = {
      id: evaluation.id,
      name: evaluation.name,
      status: evaluation.status.toLowerCase() as 'completed' | 'inProgress' | 'readyForReview' | 'inUse' | 'pending',
      type: evaluation.type.toLowerCase() as 'admission' | 'daily' | 'cyclic',
      expectedDate: evaluation.expectedDate,
      completedDate: evaluation.completedDate,
      category,
    };
    
    // Add to appropriate category
    if (category in result && Array.isArray(result[category as keyof typeof result])) {
      (result[category as keyof typeof result] as EvaluationMetric[]).push(metric);
    }
    
    // Update status counts
    const status = evaluation.status.toLowerCase().replace(/\s+/g, '');
    if (status === 'completed') {
      result.statusCounts.completed++;
    } else if (status === 'inprogress') {
      result.statusCounts.inProgress++;
    } else if (status === 'readyforreview') {
      result.statusCounts.readyForReview++;
    } else if (status === 'inuse') {
      result.statusCounts.inUse++;
    }
  });
  
  return result;
}
