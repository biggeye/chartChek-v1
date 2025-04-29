import React from 'react';
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
import { EvaluationMetrics } from '~/types/evaluations';
s
interface EvaluationMetricsDashboardProps {
  metrics: EvaluationMetrics | any;
}

const CATEGORY_ICONS = {
  assessments: DocumentCheckIcon,
  screenings: BeakerIcon,
  treatmentPlans: ClipboardDocumentListIcon,
  consents: DocumentTextIcon,
  administrative: DocumentDuplicateIcon,
  medical: UserGroupIcon,
  other: DocumentIcon
};

export default function EvaluationMetricsDashboard({ metrics }: EvaluationMetricsDashboardProps) {
  if (!metrics) {
    return <div className="p-4 text-center">No evaluation data available</div>;
  }

  // Calculate completion percentage
  const totalRequired = metrics.totalRequired || 0;
  const completed = metrics.completed || 0;
  const completionPercentage = totalRequired > 0 ? (completed / totalRequired) * 100 : 0;

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
      case 'in progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'readyforreview':
        return <DocumentCheckIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Missing evaluations (if provided)
  const missingEvaluations = metrics.missingEvaluations || [];

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
            <div className="text-xl font-semibold text-green-500">{metrics.completed}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-xl font-semibold text-yellow-500">{metrics.inProgress}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">For Review</div>
            <div className="text-xl font-semibold text-blue-500">{metrics.readyForReview}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Overdue</div>
            <div className="text-xl font-semibold text-red-500">{metrics.overdue}</div>
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
            {missingEvaluations.map((evaluation: string, index: number) => (
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
            const categoryItems = metrics[category as keyof EvaluationMetrics] as any[];
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
                  {categoryItems.slice(0, 3).map((item: any) => (
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
