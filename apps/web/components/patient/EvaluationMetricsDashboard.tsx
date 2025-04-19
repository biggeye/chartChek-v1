import React, { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon, 
  DocumentCheckIcon,
  DocumentIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { EvaluationMetricsCollection } from '~/types/evaluations'
import { parseEvaluationMetrics, calculateCompletionPercentage, identifyMissingEvaluations } from '~/lib/kipu/service/evaluation-metrics-service';

// Define props for the component
interface EvaluationMetricsDashboardProps {
  patientId: string;
  evaluationsData: any; // Raw evaluations data from API
}

// Required evaluations for compliance
const REQUIRED_EVALUATIONS = [
  'Pre-Admission Assessment',
  'Bio-psychosocial Assessment',
  'LOCUS Assessment with Scoring',
  'Initial Psychiatric Evaluation',
  'History and Physical Exam',
  'Problem List',
  'Clinical Individualized Treatment Plan',
  'Trauma Assessment',
  'Columbia-Suicide Severity Rating Scale',
  'Medications Informed Consent',
  'Nutritional Screen',
  'Pain Screen',
  'Self Preservation Statement',
  'Initial Aftercare Plan',
  'Social Risk Assessment'
];

// Category icons mapping
const CATEGORY_ICONS = {
  assessments: DocumentCheckIcon,
  screenings: BeakerIcon,
  treatmentPlans: ClipboardDocumentListIcon,
  consents: DocumentTextIcon,
  administrative: DocumentDuplicateIcon,
  medical: UserGroupIcon,
  other: DocumentIcon
};

export default function EvaluationMetricsDashboard({ patientId, evaluationsData }: EvaluationMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<EvaluationMetricsCollection | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [missingEvaluations, setMissingEvaluations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evaluationsData) {
      setLoading(false);
      return;
    }

    try {
      // Parse the evaluations data
      const parsedMetrics = parseEvaluationMetrics(evaluationsData);
      setMetrics(parsedMetrics);

      // Calculate completion percentage
      const percentage = calculateCompletionPercentage(parsedMetrics);
      setCompletionPercentage(percentage);

      // Identify missing evaluations
      const missing = identifyMissingEvaluations(parsedMetrics, REQUIRED_EVALUATIONS);
      setMissingEvaluations(missing);

      setLoading(false);
    } catch (err) {
      setError('Error processing evaluation metrics');
      setLoading(false);
      console.error('Error processing evaluation metrics:', err);
    }
  }, [evaluationsData]);

  if (loading) {
    return <div className="p-4 text-center">Loading evaluation metrics...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-center">No evaluation data available</div>;
  }

  // Determine completion status color
  const getCompletionStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'inprogress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'readyforreview':
        return <DocumentCheckIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      
      {/* Overall Completion Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Completion Status</h3>
          <span className={`text-lg font-bold ${getCompletionStatusColor(completionPercentage)}`}>
            {completionPercentage.toFixed(0)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              completionPercentage >= 90 ? 'bg-green-500' : 
              completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        {/* Status Counts */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-xl font-semibold text-green-500">{metrics.statusCounts.completed}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-xl font-semibold text-yellow-500">{metrics.statusCounts.inProgress}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">For Review</div>
            <div className="text-xl font-semibold text-blue-500">{metrics.statusCounts.readyForReview}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">In Use</div>
            <div className="text-xl font-semibold text-indigo_dye-500">{metrics.statusCounts.inUse}</div>
          </div>
        </div>
      </div>
      
      {/* Missing Evaluations */}
      {missingEvaluations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-1" />
            Missing Required Evaluations
          </h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {missingEvaluations.map((evaluation, index) => (
              <li key={index} className="mb-1">{evaluation}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-medium mb-3">Evaluation Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(CATEGORY_ICONS).map(([category, Icon]) => {
            const categoryItems = metrics[category as keyof EvaluationMetricsCollection] as any[];
            if (!categoryItems || categoryItems.length === 0) return null;
            
            return (
              <div key={category} className="border rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <Icon className="h-5 w-5 text-indigo_dye-500 mr-2" />
                  <h4 className="text-md font-medium capitalize">{category}</h4>
                  <span className="ml-auto bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                    {categoryItems.length}
                  </span>
                </div>
                <ul className="text-sm space-y-1">
                  {categoryItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className="ml-2 truncate">{item.name}</span>
                    </li>
                  ))}
                  {categoryItems.length > 3 && (
                    <li className="text-xs text-gray-500 italic">
                      +{categoryItems.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
