import { EvaluationMetricsCollection, parseEvaluations } from 'types/evaluationMetrics';

/**
 * Parses KIPU evaluation data into a structured metrics format
 * for deficiency analysis and comparison with other patient records
 */
export function parseEvaluationMetrics(data: any): EvaluationMetricsCollection {
  if (!data || !Array.isArray(data.evaluations)) {
    throw new Error('Invalid evaluation data structure');
  }
  
  return parseEvaluations(data.evaluations);
}

/**
 * Identifies missing evaluations based on a required set
 * @param metrics - The parsed evaluation metrics
 * @param requiredEvaluations - Array of evaluation names that are required
 * @returns Array of missing evaluation names
 */
export function identifyMissingEvaluations(
  metrics: EvaluationMetricsCollection, 
  requiredEvaluations: string[]
): string[] {
  // Normalize the required evaluation names
  const normalizedRequired = requiredEvaluations.map(name => name.trim().toLowerCase());
  
  // Get all normalized names from the metrics
  const existingEvaluations = Object.values(metrics.byId).map(e => e.normalizedName);
  
  // Find the missing evaluations
  return normalizedRequired.filter(req => !existingEvaluations.some(existing => existing.includes(req)));
}

/**
 * Calculates completion percentage for evaluations
 * @param metrics - The parsed evaluation metrics
 * @returns Percentage of completed evaluations
 */
export function calculateCompletionPercentage(metrics: EvaluationMetricsCollection): number {
  const total = Object.values(metrics.statusCounts).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) return 0;
  
  return (metrics.statusCounts.completed / total) * 100;
}

/**
 * Compares evaluation metrics between patients
 * @param patientMetrics - Map of patient IDs to their evaluation metrics
 * @returns Comparison analysis with deficiencies
 */
export function comparePatientEvaluations(
  patientMetrics: Record<string, EvaluationMetricsCollection>
): Record<string, any> {
  const patientIds = Object.keys(patientMetrics);
  
  // Basic comparison structure
  const comparison: Record<string, any> = {
    patientCount: patientIds.length,
    completionRates: {},
    categoryBreakdown: {},
    deficiencies: {}
  };
  
  // Calculate completion rates for each patient
  patientIds.forEach(id => {
    const metrics = patientMetrics[id];
    if (!metrics) return; 
    comparison.completionRates[id] = calculateCompletionPercentage(metrics);
  });
  
  // Calculate average evaluations per category across patients
  const categories = ['assessments', 'screenings', 'treatmentPlans', 'consents', 'administrative', 'medical'];
  
  categories.forEach(category => {
    comparison.categoryBreakdown[category] = {
      average: patientIds.reduce((sum, id) => {
        const metrics = patientMetrics[id];
        if (!metrics) return sum; 
        return sum + (metrics[category as keyof EvaluationMetricsCollection] as any[]).length;
      }, 0) / (patientIds.length || 1) // Avoid division by zero if no patients
    };
  });
  
  // Identify deficiencies for each patient
  patientIds.forEach(id => {
    const metrics = patientMetrics[id];
    if (!metrics) return;
    const deficiencies = [];
    
    // Check for incomplete evaluations
    const incomplete = Object.values(metrics.byId).filter(
      e => e.status !== 'completed' && e.status !== 'in use'
    );
    
    if (incomplete.length > 0) {
      deficiencies.push({
        type: 'incomplete',
        count: incomplete.length,
        items: incomplete.map(e => e.name)
      });
    }
    
    // Check for missing standard evaluations compared to other patients
    // This is a simplified approach - in a real implementation, you would
    // have a predefined list of required evaluations based on facility standards
    
    comparison.deficiencies[id] = deficiencies;
  });
  
  return comparison;
}

/**
 * Example usage with the provided data
 */
export function exampleUsage(rawData: any): void {
  // Parse the evaluations
  const metrics = parseEvaluationMetrics(rawData);
  
  console.log('Evaluation Metrics:');
  console.log(`Total evaluations: ${Object.keys(metrics.byId).length}`);
  console.log(`Completed: ${metrics.statusCounts.completed}`);
  console.log(`In progress: ${metrics.statusCounts.inProgress}`);
  console.log(`Ready for review: ${metrics.statusCounts.readyForReview}`);
  console.log(`In use: ${metrics.statusCounts.inUse}`);
  
  console.log('\nCategory breakdown:');
  console.log(`Assessments: ${metrics.assessments.length}`);
  console.log(`Screenings: ${metrics.screenings.length}`);
  console.log(`Treatment plans: ${metrics.treatmentPlans.length}`);
  console.log(`Consents: ${metrics.consents.length}`);
  console.log(`Administrative: ${metrics.administrative.length}`);
  console.log(`Medical: ${metrics.medical.length}`);
  console.log(`Other: ${metrics.other.length}`);
  
  // Example of identifying missing evaluations
  const requiredEvaluations = [
    'Pre-Admission Assessment',
    'Bio-psychosocial Assessment',
    'LOCUS Assessment with Scoring',
    'Initial Psychiatric Evaluation',
    'History and Physical Exam',
    'Problem List',
    'Clinical Individualized Treatment Plan'
  ];
  
  const missing = identifyMissingEvaluations(metrics, requiredEvaluations);
  console.log('\nMissing required evaluations:');
  console.log(missing.length > 0 ? missing : 'None');
  
  // Example of completion percentage
  const completionPercentage = calculateCompletionPercentage(metrics);
  console.log(`\nCompletion percentage: ${completionPercentage.toFixed(2)}%`);
}
