// app/product/patients/[id]/treatment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircleIcon, CalendarDaysIcon, HeartIcon } from '@heroicons/react/24/outline';
import { usePatientStore } from '~/store/patient/patientStore';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/ui/select';
import { useProtocolStore } from '~/store/protocolStore';
import { useTemplateStore } from '~/store/doc/templateStore';

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

  const { fetchProtocols, protocols, isLoading: isLoadingProtocols, error: protocolsError, fetchRequirementsForProtocol } = useProtocolStore();
  const { kipuTemplates, fetchKipuTemplates } = useTemplateStore();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
 
  // Fetch protocols on mount
  useEffect(() => {
    fetchProtocols();
  }, []);

  // Fetch evaluation templates on mount (for requirement names)
  useEffect(() => {
    fetchKipuTemplates();
  }, [fetchKipuTemplates]);

  // Fetch metrics when selectedProtocol changes
  useEffect(() => {
    if (selectedProtocol) {
      console.log('selectedProtocol', selectedProtocol);
    }
  }, [selectedProtocol]);

  // Handle protocol fetch errors
  useEffect(() => {
    if (protocolsError) {
      setError(protocolsError);
    }
  }, [protocolsError]);

  // Fetch requirements when selectedProtocol changes
  useEffect(() => {
    if (!selectedProtocol) {
      setRequirements([]);
      return;
    }
    setRequirementsLoading(true);
    setRequirementsError(null);
    fetchRequirementsForProtocol(selectedProtocol)
      .then((reqs) => {
        // Join with templates to add name
        const reqsWithNames = reqs.map(r => {
          const tpl = kipuTemplates.find(t => t.id === r.evaluation_id);
          return { ...r, name: tpl?.name || `Evaluation ${r.evaluation_id}` };
        });
        setRequirements(reqsWithNames);
      })
      .catch((err) => setRequirementsError(err.message || 'Failed to fetch requirements'))
      .finally(() => setRequirementsLoading(false));
  }, [selectedProtocol, fetchRequirementsForProtocol, kipuTemplates]);



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

  // Normalize patientEvaluations for dashboard
  const normalizedPatientEvaluations = (patientEvaluations || []).map(ev => ({
    ...ev,
    evaluationId: ev.evaluationId || ev.id,
    // If you have a way to determine type, add it here. Otherwise, leave as is.
    type: ev.type || null
  }));

  // Get admission date and days since admission
  const admissionDate = selectedPatient?.admissionDate;
  const daysSinceAdmission = admissionDate
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(admissionDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  // Get cycle length from protocol (default 7)
  const cycleLength = (() => {
    // Try to get from selected protocol
    const protocol = protocols?.find(p => p.id === selectedProtocol);
    return protocol?.cycleLength || 7;
  })();

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
      
      {/* Protocol Selector */}
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


      {/* Evaluation Metrics Dashboard */}
      <div className="mt-4">
        {/* Inline Protocol Compliance Metrics */}
        {requirements.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Protocol Compliance</h3>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              {['admission', 'daily', 'cyclic'].map((type) => {
                // Requirements for this type
                const reqs = requirements.filter(r => r.requirement === type);
                let required = 0;
                let completed = 0;
                if (type === 'admission') {
                  required = reqs.length;
                  completed = reqs.filter(req =>
                    patientEvaluations.some(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed')
                  ).length;
                } else {
                  reqs.forEach(req => {
                    if (type === 'daily') {
                      required = daysSinceAdmission;
                      completed += patientEvaluations.filter(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed').length;
                    } else if (type === 'cyclic') {
                      required = Math.floor(daysSinceAdmission / cycleLength);
                      completed += patientEvaluations.filter(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed').length;
                    }
                  });
                }
                // Avoid division by zero
                const percent = required > 0 ? (completed / required) * 100 : 0;
                return (
                  <div key={type} className="flex flex-col items-center">
                    <div className="mb-2 font-semibold capitalize">{type}</div>
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="absolute top-0 left-0" width="80" height="80">
                        <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle
                          cx="40" cy="40" r="36"
                          stroke={type === 'admission' ? '#10b981' : type === 'daily' ? '#3b82f6' : '#f59e42'}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 * (1 - percent / 100)}
                          style={{ transition: 'stroke-dashoffset 0.35s' }}
                        />
                      </svg>
                      <span className="text-lg font-bold z-10">{Math.round(percent)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{completed} / {required} completed</div>
                  </div>
                );
              })}
            </div>
            {/* Breakdown Table */}
            <div className="mt-6">
              <table className="min-w-full text-sm border rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">Evaluation</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map(req => {
                    const type = req.requirement;
                    let required = 0;
                    let completed = 0;
                    if (type === 'admission') {
                      required = 1;
                      completed = patientEvaluations.some(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed') ? 1 : 0;
                    } else if (type === 'daily') {
                      required = daysSinceAdmission;
                      completed = patientEvaluations.filter(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed').length;
                    } else if (type === 'cyclic') {
                      required = Math.floor(daysSinceAdmission / cycleLength);
                      completed = patientEvaluations.filter(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed').length;
                    }
                    let status = 'Not Started';
                    if (completed >= required && required > 0) status = 'Completed';
                    else if (completed > 0) status = 'In Progress';
                    return (
                      <tr key={req.requirement + '-' + req.evaluation_id}>
                        <td className="px-2 py-1 capitalize">{req.requirement}</td>
                        <td className="px-2 py-1">{req.name}</td>
                        <td className="px-2 py-1">{status} ({completed} / {required})</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Treatment Compliance Timeline</h2>
        {(() => {
          try {
            if (!admissionDate) {
              return <div className="text-center py-4 text-red-500">No admission date found</div>;
            }
            const admissionDateObj = new Date(admissionDate);
            if (isNaN(admissionDateObj.getTime())) {
              return <div className="text-center py-4 text-red-500">Invalid admission date</div>;
            }
            const safeCycleLength = Number.isFinite(cycleLength) && cycleLength > 0 ? cycleLength : 7;
            if (!Number.isFinite(safeCycleLength) || safeCycleLength <= 0) {
              return <div className="text-center py-4 text-red-500">Invalid cycle length</div>;
            }

            // --- Admission Block ---
            const admissionReqs = (requirements || []).filter(r => r.requirement === 'admission');
            const admissionCompleted = admissionReqs.filter(req =>
              (patientEvaluations || []).some(ev => (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed')
            ).length;
            const admissionTotal = admissionReqs.length;
            const admissionCompliant = admissionCompleted === admissionTotal && admissionTotal > 0;

            // --- Daily Block ---
            const dailyReqs = (requirements || []).filter(r => r.requirement === 'daily');
            const totalDays = daysSinceAdmission - 1;
            const cyclesCompleted = Math.floor(totalDays / safeCycleLength);
            const cycleDays = cyclesCompleted * safeCycleLength;
            const dailiesRequired = Math.max(0, (totalDays - cycleDays) * dailyReqs.length);
            const dailiesCompleted = dailyReqs.reduce((sum, req) => {
              return sum + (patientEvaluations || []).filter(ev => {
                const evDate = ev.createdAt ? new Date(ev.createdAt) : null;
                if (!evDate || isNaN(evDate.getTime())) return false;
                const isAfterAdmission = evDate > admissionDateObj;
                return (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed' && isAfterAdmission;
              }).length;
            }, 0);
            const dailyCompliant = dailiesCompleted >= dailiesRequired && dailiesRequired > 0;

            // --- Cycles Blocks ---
            const cycleBlocks = [];
            for (let i = 0; i < cyclesCompleted; i++) {
              const cycleStart = new Date(admissionDateObj.getTime() + (i * safeCycleLength + 1) * 24 * 60 * 60 * 1000);
              const cycleEnd = new Date(admissionDateObj.getTime() + ((i + 1) * safeCycleLength) * 24 * 60 * 60 * 1000);
              const cyclicReqs = (requirements || []).filter(r => r.requirement === 'cyclic');
              const cyclicsRequired = cyclicReqs.length;
              const cyclicsCompleted = cyclicReqs.reduce((sum, req) => {
                return sum + (patientEvaluations || []).filter(ev => {
                  const evDate = ev.createdAt ? new Date(ev.createdAt) : null;
                  if (!evDate || isNaN(evDate.getTime())) return false;
                  return (ev.evaluationId || ev.id) === req.evaluation_id && ev.status === 'completed' && evDate >= cycleStart && evDate <= cycleEnd;
                }).length;
              }, 0);
              const compliant = cyclicsCompleted >= cyclicsRequired && cyclicsRequired > 0;
              cycleBlocks.push({
                cycle: i + 1,
                start: cycleStart,
                end: cycleEnd,
                required: cyclicsRequired,
                completed: cyclicsCompleted,
                compliant
              });
            }

            // --- Render Timeline ---
            return (
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                {/* Admission Block */}
                <div className={`flex-1 border rounded-lg p-4 flex flex-col items-center bg-gray-50 relative group ${admissionCompliant ? 'border-green-400' : 'border-red-400'}`}
                  title={`Admission: ${admissionCompleted} / ${admissionTotal} completed`}>
                  <div className="font-bold text-indigo-700 mb-1">Admission</div>
                  <div className="text-xs text-gray-500 mb-2">{admissionDateObj.toLocaleDateString()}</div>
                  <div className={`text-2xl font-bold ${admissionCompliant ? 'text-green-600' : 'text-red-500'}`}>{admissionCompleted} / {admissionTotal}</div>
                  <div className="text-xs mt-1">{admissionCompliant ? 'Compliant' : 'Incomplete'}</div>
                </div>
                {/* Daily Block */}
                <div className={`flex-1 border rounded-lg p-4 flex flex-col items-center bg-gray-50 relative group ${dailyCompliant ? 'border-green-400' : 'border-red-400'}`}
                  title={`Dailies: ${dailiesCompleted} / ${dailiesRequired} completed`}>
                  <div className="font-bold text-blue-700 mb-1">Daily Compliance</div>
                  <div className="text-xs text-gray-500 mb-2">Since Admission</div>
                  <div className={`text-2xl font-bold ${dailyCompliant ? 'text-green-600' : 'text-red-500'}`}>{dailiesCompleted} / {dailiesRequired}</div>
                  <div className="text-xs mt-1">{dailyCompliant ? 'Compliant' : 'Incomplete'}</div>
                </div>
                {/* Cycle Blocks */}
                {cycleBlocks.map(cycle => (
                  <div key={cycle.cycle} className={`flex-1 border rounded-lg p-4 flex flex-col items-center bg-gray-50 relative group ${cycle.compliant ? 'border-green-400' : 'border-red-400'}`}
                    title={`Cycle ${cycle.cycle}: ${cycle.completed} / ${cycle.required} completed\n${cycle.start.toLocaleDateString()} - ${cycle.end.toLocaleDateString()}`}
                  >
                    <div className="font-bold text-amber-700 mb-1">Cycle {cycle.cycle}</div>
                    <div className="text-xs text-gray-500 mb-2">{cycle.start.toLocaleDateString()} - {cycle.end.toLocaleDateString()}</div>
                    <div className={`text-2xl font-bold ${cycle.compliant ? 'text-green-600' : 'text-red-500'}`}>{cycle.completed} / {cycle.required}</div>
                    <div className="text-xs mt-1">{cycle.compliant ? 'Compliant' : 'Incomplete'}</div>
                  </div>
                ))}
              </div>
            );
          } catch (err) {
            return <div className="text-center py-4 text-red-500">Timeline error: {(err instanceof Error ? err.message : String(err))}</div>;
          }
        })()}
      </div>
    </div>
  );
}