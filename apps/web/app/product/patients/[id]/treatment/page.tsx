// app/product/patients/[id]/treatment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircleIcon, CalendarDaysIcon, HeartIcon } from '@heroicons/react/24/outline';
import { usePatientStore } from '~/store/patient/patientStore';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/ui/select';
import EvaluationMetricsDashboard from '~/components/patient/EvaluationMetricsDashboard';
import { useProtocolStore } from '~/store/protocolStore';

// Define a type for timeline activities
interface TimelineActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  description: string;
  icon: any; // Ideally replace with proper icon type
}

// Activity type mapping for the timeline
const activityTypeIcons = {
  'evaluation': CheckCircleIcon,
  'appointment': CalendarDaysIcon,
  'vital': HeartIcon,
};

export default function PatientTreatmentPlan() {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { id: patientId } = useParams<{ id: string }>();
  
  // Access patient state (still needed for context, maybe patient name?)
  const {
    selectedPatient, 
    isLoadingPatients, 
    error: patientError // Alias patient error
  } = usePatientStore();

  // Access evaluations state via the hook
  const {
    patientEvaluations,
    isLoadingEvaluations,
    error: evaluationsError // Alias evaluations error
  } = usePatientEvaluations();

  const { fetchProtocols, protocols, isLoading: isLoadingProtocols, error: protocolsError } = useProtocolStore();
 
  // Fetch protocols on mount
  useEffect(() => {
    fetchProtocols();
  }, []);

  // Fetch metrics when selectedProtocol changes
  useEffect(() => {
    if (selectedProtocol) {
      fetchMetrics();
    }
  }, [selectedProtocol]);

  // Handle protocol fetch errors
  useEffect(() => {
    if (protocolsError) {
      setError(protocolsError);
    }
  }, [protocolsError]);

  const fetchMetrics = async () => {
    if (!selectedProtocol) {
      setError('Please select a protocol.');
      return;
    }
    setLoading(true);
    setError(null);
    setMetrics(null);
    try {
      const res = await fetch(
        `/api/compliance/metrics?protocolId=${selectedProtocol}&patientId=${patientId}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch metrics');
      setMetrics(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Format evaluations data for the metrics dashboard
  const [evaluationsData, setEvaluationsData] = useState<any>(null);

  // Generate timeline activities from patient data
  const [timelineActivities, setTimelineActivities] = useState<TimelineActivity[]>([]);

  useEffect(() => {
    // This effect now depends on the evaluations data from the hook
    // We don't need selectedPatient here unless we filter activities by it
    // if (!selectedPatient) return;
    
    const activities: TimelineActivity[] = [];
    // const evaluations = useEvaluationsStore.getState().patientEvaluations; // Remove direct store access
    
    // Add evaluations to timeline using data from the hook
    if (patientEvaluations) {
      // Format data for the metrics dashboard
      setEvaluationsData({
        evaluations: patientEvaluations,
        pagination: {
          page: 1,
          pages: 1,
          limit: 100,
          total: patientEvaluations.length
        }
      });
      
      patientEvaluations.forEach(evaluation => {
        activities.push({
          id: `eval-${evaluation.id}`,
          type: 'evaluation',
          title: evaluation.name,
          date: evaluation.createdAt,
          description: `Status: ${evaluation.status}`,
          icon: activityTypeIcons['evaluation']
        });
      });
    }
    
    // Sort activities by date (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort newest first
    
    setTimelineActivities(activities);
  }, [patientEvaluations]); // Run effect when evaluations data changes

  // Combine loading states
  if (isLoadingPatients || isLoadingEvaluations) {
    return <div className="p-2">Loading treatment plan...</div>;
  }

  // Combine error states
  const combinedError = patientError || evaluationsError;
  if (combinedError) {
    return <div className="p-2 text-red-500">Error loading treatment plan: {combinedError}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Evaluation Metrics Dashboard */}
      <div>
        <label className="block text-sm font-medium mb-1">Protocol</label>
        <Select
          value={selectedProtocol ?? ''}
          onValueChange={setSelectedProtocol}
          disabled={isLoadingProtocols}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingProtocols ? 'Loading protocols...' : 'Select a protocol'} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingProtocols ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : protocols && protocols.length > 0 ? (
              protocols.map(protocol => (
                <SelectItem key={protocol.id} value={protocol.id}>
                  {protocol.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-protocols" disabled>
                No protocols available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {protocolsError && (
          <div className="text-red-500 text-xs mt-1">{protocolsError}</div>
        )}
      </div>
      <div className="mt-4">
        <EvaluationMetricsDashboard metrics={metrics} />
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Treatment Timeline</h2>
        
        <div className="flow-root mt-6">
          <ul className="-mb-4">
            {timelineActivities.length > 0 ? (
              timelineActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-4">
                    {activityIdx !== timelineActivities.length - 1 ? (
                      <span className="absolute top-2 left-2 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100">
                          {activity.icon && <activity.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {activity.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-gray-500">No treatment activities found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}