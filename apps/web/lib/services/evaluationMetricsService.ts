import { kipuGetPatientEvaluations } from '~/lib/kipu/service/patient-evaluation-service';
import { KipuCredentials, KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';
import { ProtocolEvaluation } from '~/types/protocol';
import { ComplianceProtocol } from '~/types/evaluation';

// Types for our metrics service
export interface EvaluationStatus {
  id: number;
  name: string;
  status: 'completed' | 'inProgress' | 'readyForReview' | 'inUse' | 'missing';
  category: string;
  lastUpdated: string;
  dueDate?: string;
}

export interface EvaluationMetrics {
  totalRequired: number;
  completed: number;
  inProgress: number;
  readyForReview: number;
  inUse: number;
  missing: number;
  completionPercentage: number;
  evaluations: EvaluationStatus[];
  byCategory: Record<string, EvaluationStatus[]>;
}

/**
 * Fetches and analyzes a patient's evaluation metrics against protocol requirements
 */
export async function getPatientEvaluationMetrics(
  patientId: string,
  credentials: any,
  requiredEvaluations: ProtocolEvaluation[]
): Promise<EvaluationMetrics> {
  // 1) Fetch raw patient evaluations
  const response = await kipuGetPatientEvaluations<any>(patientId, credentials);
  if (!response.success || !response.data) {
    throw new Error('Failed to fetch patient evaluations');
  }
  console.log('##########################################sRAW kipu response.data:', response.data);

  // 2) Extract the array of evaluations
  let patientEvaluations: KipuPatientEvaluation[] = [];
  if (Array.isArray(response.data)) {
    patientEvaluations = response.data;
  } else if (Array.isArray((response.data as any).patient_evaluations)) {
    patientEvaluations = (response.data as any).patient_evaluations;
  } else if (Array.isArray((response.data as any).patientEvaluations)) {
    patientEvaluations = (response.data as any).patientEvaluations;
  } else {
    console.warn(
      'Unexpected response.data shape—no array found'
    );
  }
  console.log('######################################Extracted patientEvaluations:', patientEvaluations);

  // 3) Build map keyed by the template ID (evaluationId)
  const evalByTemplateId = new Map<number, KipuPatientEvaluation>();
  for (const pe of patientEvaluations) {
    const tid = (pe as any).evaluationId ?? (pe as any).evaluation_id;
    console.log(`Mapping instance id=${pe.id} → templateId=${tid}`);
    evalByTemplateId.set(Number(tid), pe);
  }
  console.log(
    'Map keys (template IDs) available:',
    Array.from(evalByTemplateId.keys())
  );

  // 4) Log what the protocol requires
  const requiredIds = requiredEvaluations.map((r) => r.id);
  console.log('Protocol requires template IDs:', requiredIds);

  // 5) Compare to see which IDs matched
  console.log(
    'Missing (required but not fetched):',
    requiredIds.filter((id) => !evalByTemplateId.has(id))
  );
  console.log(
    'Present (required and fetched):',
    requiredIds.filter((id) => evalByTemplateId.has(id))
  );

  // 6) Initialize metrics
  const metrics: EvaluationMetrics = {
    totalRequired: requiredEvaluations.length,
    completed: 0,
    inProgress: 0,
    readyForReview: 0,
    inUse: 0,
    missing: 0,
    completionPercentage: 0,
    evaluations: [],
    byCategory: {},
  };
  requiredEvaluations.forEach((req) => {
    metrics.byCategory[req.category] = [];
  });

  // 7) Status normalizer
  const normalizeStatus = (raw: string): EvaluationStatus['status'] => {
    const s = raw.toLowerCase().replace(/\s+/g, '');
    if (s === 'completed') return 'completed';
    if (s === 'inprogress') return 'inProgress';
    if (s === 'readyforreview') return 'readyForReview';
    if (s === 'inuse') return 'inUse';
    return 'missing';
  };

  // 8) Process each required evaluation
  for (const req of requiredEvaluations) {
    console.log(`Looking up templateId=${req.id}`);
    const pe = evalByTemplateId.get(req.id);
    console.log(` → found patientEval:`, pe);

    const status = pe ? normalizeStatus(pe.status) : 'missing';
    const rec: EvaluationStatus = {
      id: req.id,
      name: req.name,
      status,
      category: req.category,
      lastUpdated: pe?.updatedAt ?? '',
      dueDate: req.dueDate ?? '<no dueDate>',
    };
    console.log(' → built record:', rec);

    // tally
    switch (status) {
      case 'completed':
        metrics.completed++;
        break;
      case 'inProgress':
        metrics.inProgress++;
        break;
      case 'readyForReview':
        metrics.readyForReview++;
        break;
      case 'inUse':
        metrics.inUse++;
        break;
      default:
        metrics.missing++;
    }

    metrics.evaluations.push(rec);
    metrics.byCategory[req.category].push(rec);
  }

  // 9) Final completion percentage
  metrics.completionPercentage =
    metrics.totalRequired > 0
      ? (metrics.completed / metrics.totalRequired) * 100
      : 0;

  console.log('Final metrics:', metrics);
  return metrics;
}




/**
 * Helper function to get evaluation status icon
 */
export function getEvaluationStatusIcon(status: EvaluationStatus['status']) {
  switch (status) {
    case 'completed':
      return '✅';
    case 'inProgress':
      return '⏳';
    case 'readyForReview':
      return '📝';
    case 'inUse':
      return '🔒';
    case 'missing':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Helper function to get evaluation status color
 */
export function getEvaluationStatusColor(status: EvaluationStatus['status']) {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'inProgress':
      return 'text-yellow-500';
    case 'readyForReview':
      return 'text-blue-500';
    case 'inUse':
      return 'text-purple-500';
    case 'missing':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
} 