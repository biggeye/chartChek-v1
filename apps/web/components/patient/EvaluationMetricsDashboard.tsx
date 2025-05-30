import React, { useState } from 'react';
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

interface EvaluationMetricsDashboardProps {
  patientEvaluations: any[];
  requirements: any[];
  chartStartDate?: string;
  chartEndDate?: string;
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

function CircleProgress({ percent, label, color, onClick }: { percent: number; label: string; color: string; onClick?: () => void }) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="text-lg font-bold mt-1">{Math.round(percent)}%</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export default function EvaluationMetricsDashboard({ patientEvaluations, requirements, chartStartDate, chartEndDate }: EvaluationMetricsDashboardProps) {
  const [modalType, setModalType] = useState<null | 'admission' | 'daily' | 'cyclic'>(null);
  const safeRequirements = requirements ?? [];
  const safePatientEvaluations = patientEvaluations ?? [];

  // Group requirements by type
  const types: Array<'admission' | 'daily' | 'cyclic'> = ['admission', 'daily', 'cyclic'];

  // Status helpers
  const getKipuStatus = (status: string | undefined) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'complete') return 'Complete';
    if (s === 'open') return 'In Progress';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // For each type, calculate progress and color
  const progressByType: Record<'admission' | 'daily' | 'cyclic', { percent: number; color: string; completed: number; open: number; missing: number; total: number }> = {
    admission: { percent: 0, color: '#e5e7eb', completed: 0, open: 0, missing: 0, total: 0 },
    daily: { percent: 0, color: '#e5e7eb', completed: 0, open: 0, missing: 0, total: 0 },
    cyclic: { percent: 0, color: '#e5e7eb', completed: 0, open: 0, missing: 0, total: 0 },
  };

  types.forEach(type => {
    const reqs = safeRequirements.filter(r => r.requirement === type);
    let completed = 0;
    let open = 0;
    let missing = 0;
    reqs.forEach(req => {
      const matches = safePatientEvaluations.filter(ev => String(ev.evaluationId) === String(req.evaluation_id));
      if (matches.length === 0) {
        missing++;
      } else if (matches.some(ev => getKipuStatus(ev.status) === 'Complete')) {
        completed++;
      } else if (matches.some(ev => getKipuStatus(ev.status) === 'In Progress')) {
        open++;
      } else {
        // If there are matches but none are "Complete" or "In Progress", treat as missing
        missing++;
      }
    });
    const total = reqs.length;
    let percent = 0;
    if (total > 0) {
      percent = ((completed + open) / total) * 100;
    }
    // Color logic
    let color = '#e5e7eb'; // gray by default
    if (missing > 0) {
      color = '#e5e7eb'; // gray if any missing
    } else if (completed === total) {
      color = '#10b981'; // green if all completed
    } else if (open === total) {
      color = '#fbbf24'; // yellow if all open
    } else if (completed + open === total) {
      color = '#fbbf24'; // yellow if mix of open and completed
    }
    progressByType[type] = { percent, color, completed, open, missing, total };
  });

  // Calculate overall completion percentage
  const totalRequired = safeRequirements.length;
  const totalCompleted = types.reduce((sum, type) => sum + progressByType[type].completed, 0);
  const completionPercentage = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

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


  // Helper to calculate days between two dates
  function daysBetween(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Refactored getEvaluationStatus
  function getEvaluationStatus(evaluationId: number, type: 'admission' | 'daily' | 'cyclic') {
    // Only consider evaluations for this requirement, type, and chart
    const relevant = safePatientEvaluations.filter(
      (e) => e.evaluationId === evaluationId
    );
    if (type === 'admission') {
      return relevant.some(e => e.status === 'completed') ? 'Completed' : 'Not Started';
    }
    // For daily/cyclic, calculate required count
    let requiredCount = 1;
    if (type === 'daily' && chartStartDate && chartEndDate) {
      requiredCount = daysBetween(chartStartDate, chartEndDate);
    }
    if (type === 'cyclic' && chartStartDate && chartEndDate) {
      const req = safeRequirements.find(r => r.evaluation_id === evaluationId && r.requirement === 'cyclic');
      const cycleLength = req?.cycle_length ?? 1;
      requiredCount = Math.ceil(daysBetween(chartStartDate, chartEndDate) / cycleLength);
    }
    const completedCount = relevant.filter(e => e.status === 'completed').length;
    if (completedCount >= requiredCount) return 'Completed';
    if (completedCount > 0) return 'In Progress';
    return 'Not Started';
  }


    const metrics = {
      completed: totalCompleted,
      inProgress: 0,
      readyForReview: 0,
    }


  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      {/* Protocol Compliance Progress Circles */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Protocol Compliance</h3>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          {types.map(type => (
            <CircleProgress
              key={type}
              percent={progressByType[type].percent}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              color={progressByType[type].color}
              onClick={() => setModalType(type)}
            />
          ))}
        </div>
      </div>
      {/* Modal for showing evaluations for a type */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setModalType(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 capitalize">{modalType} Evaluations</h3>
            <ul className="divide-y divide-gray-200">
              {safeRequirements.filter(r => r.requirement === modalType).length === 0 ? (
                <li className="text-gray-400 py-2">No requirements for this section.</li>
              ) : (
                safeRequirements
                  .filter(r => r.requirement === modalType)
                  .map(r => (
                    <li key={r.evaluation_id} className="py-2 flex flex-col">
                      <span className="font-medium">{(r.name)}</span>
                      <span className="text-xs text-gray-500">Status: {getEvaluationStatus(r.evaluation_id, modalType)}</span>
                    </li>
                  ))
              )}
            </ul>
          </div>
        </div>
      )}
      {/* Overall Completion Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Overall Completion</h3>
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
            <div className="text-xl font-semibold text-green-500">{metrics.completed ?? 0}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-xl font-semibold text-yellow-500">{metrics?.inProgress ?? 0}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">For Review</div>
            <div className="text-xl font-semibold text-blue-500">{metrics?.readyForReview ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
