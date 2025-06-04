// app/product/patients/[id]/evaluations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import PatientEvaluationCreateModal from '~/components/patient/evaluations/CreatePatientEvaluation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/ui/select';
import { useProtocolStore } from '~/store/protocolStore';
import { useTemplateStore } from '~/store/doc/templateStore';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function KipuPatientEvaluationsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [selectedRequirementType, setSelectedRequirementType] = useState<string>('all');
  const { patientEvaluations, isLoadingEvaluations, error } = usePatientEvaluations();
  const { fetchProtocols, protocols, isLoading: isLoadingProtocols, error: protocolsError, fetchRequirementsForProtocol } = useProtocolStore();
  const { kipuTemplates, fetchKipuTemplates } = useTemplateStore();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [expandedRequirementType, setExpandedRequirementType] = useState<string | null>(null);

  // Fetch protocols and templates on mount
  useEffect(() => {
    fetchProtocols();
    fetchKipuTemplates();
  }, []);

  // Fetch requirements when protocol changes
  useEffect(() => {
    if (!selectedProtocol) {
      setRequirements([]);
      return;
    }
    fetchRequirementsForProtocol(selectedProtocol)
      .then((reqs) => {
        // Join with templates to add name
        const reqsWithNames = reqs.map(r => {
          const tpl = kipuTemplates.find(t => t.id === r.evaluation_id);
          return { ...r, name: tpl?.name || `Evaluation ${r.evaluation_id}` };
        });
        setRequirements(reqsWithNames);
      })
      .catch((err) => console.error('Failed to fetch requirements:', err));
  }, [selectedProtocol, fetchRequirementsForProtocol, kipuTemplates]);

  if (isLoadingEvaluations) {
    return <div className="p-2">Loading evaluations...</div>;
  }

  if (error) {
    return <div className="p-2 text-red-500">Error loading evaluations: {error}</div>;
  }

  if (!patientEvaluations) {
    return <div className="p-2">No evaluations found for this patient.</div>;
  }
  
  // Get table data based on selected requirement type
  const getTableData = () => {
    if (selectedRequirementType === 'all') {
      return patientEvaluations;
    }

    // Get requirements for the selected type
    const typeRequirements = requirements.filter(r => r.requirement === selectedRequirementType);
    
    // Map requirements to table rows, showing evaluations if they exist
    return typeRequirements.map(req => {
      const matchingEvaluation = patientEvaluations.find(
        ev => String(ev.evaluationId || ev.id) === String(req.evaluation_id)
      );

      if (matchingEvaluation) {
        return {
          ...matchingEvaluation,
          isRequirement: true,
          requirementType: req.requirement
        };
      }

      // Return placeholder for requirement without evaluation
      return {
        id: `req-${req.evaluation_id}`,
        name: req.name,
        status: 'Not Started',
        createdAt: null,
        updatedAt: null,
        isRequirement: true,
        requirementType: req.requirement,
        evaluation_id: req.evaluation_id // Add this for the create button
      };
    });
  };

  const tableData = getTableData();

  // Calculate dynamic stats based on selected filter
  const getDynamicStats = () => {
    if (selectedRequirementType === 'all') {
      return [
        { id: 1, name: 'Total Evaluations', value: patientEvaluations.length },
        { id: 2, name: 'Completed', value: patientEvaluations.filter(e => e.status === 'Completed').length },
        { id: 3, name: 'In Progress', value: patientEvaluations.filter(e => e.status === 'in progress' || e.status === 'open').length },
      ];
    }

    const typeRequirements = requirements.filter(r => r.requirement === selectedRequirementType);
    const requiredCount = typeRequirements.length;
    const completedCount = typeRequirements.filter(req => 
      patientEvaluations.some(ev => 
        String(ev.evaluationId || ev.id) === String(req.evaluation_id) && 
        ev.status === 'Completed'
      )
    ).length;
    const inProgressCount = typeRequirements.filter(req => 
      patientEvaluations.some(ev => 
        String(ev.evaluationId || ev.id) === String(req.evaluation_id) && 
        (ev.status === 'in progress' || ev.status === 'open')
      )
    ).length;

    return [
      { id: 1, name: 'Required Evaluations', value: requiredCount },
      { id: 2, name: 'Completed', value: completedCount },
      { id: 3, name: 'In Progress', value: inProgressCount },
    ];
  };

  const dynamicStats = getDynamicStats();

  return (
    <div className="space-y-4">
      {/* Compliance Overview Card */}
      <div className="bg-white shadow rounded-lg p-4">
        {/* Protocol Selector */}
        <div className="mb-6">
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

        {/* Requirement Type Filter */}
        <div className="mb-4">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setSelectedRequirementType('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRequirementType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedRequirementType('admission')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRequirementType === 'admission'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Admission
            </button>
            <button
              onClick={() => setSelectedRequirementType('daily')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRequirementType === 'daily'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setSelectedRequirementType('cyclic')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRequirementType === 'cyclic'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Cyclic
            </button>
          </div>
        </div>

        {/* Mini Requirements List */}
        {selectedRequirementType !== 'all' && (
          <div className="mb-4">
            <button
              onClick={() => setExpandedRequirementType(
                expandedRequirementType === selectedRequirementType ? null : selectedRequirementType
              )}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>View Requirements</span>
              <ChevronDownIcon 
                className={`w-4 h-4 transition-transform ${
                  expandedRequirementType === selectedRequirementType ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedRequirementType === selectedRequirementType && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto">
                {requirements
                  .filter(r => r.requirement === selectedRequirementType)
                  .map(req => (
                    <div key={req.evaluation_id} className="text-sm text-gray-600 py-1">
                      {req.name}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evaluations Table */}
      <div className="bg-white shadow rounded-lg p-4">
        {/* Stats and Create Button Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="grid grid-cols-3 gap-4">
            {dynamicStats.map((stat) => (
              <div key={stat.id} className="bg-gray-50 p-2 rounded-lg">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-md font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
          <PatientEvaluationCreateModal patientId={patientId} onSuccess={() => window.location.reload()} />
        </div>

        {/* Evaluations list */}
        <div className="mt-3">
          {tableData.length === 0 ? (
            <p className="text-gray-500">No evaluations available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 w-2/5">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-1/6">Status</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-400 w-1/6">Created</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-400 w-1/6">Last Updated</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-400 w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {tableData.map((evaluation, idx) => (
                    <tr
                      key={evaluation.id}
                      className={`${
                        idx % 2 === 0
                          ? 'bg-white hover:bg-blue-50'
                          : 'bg-gray-50 hover:bg-blue-50'
                      } transition-colors ${
                        evaluation.isRequirement && !evaluation.createdAt ? 'opacity-75' : ''
                      }`}
                    >
                      <td className="px-4 py-2 whitespace-normal text-gray-900 max-w-xs">
                        {evaluation.createdAt ? (
                          <Link
                            href={`/product/patients/${patientId}/evaluations/${evaluation.id}`}
                            className="hover:text-blue-600 hover:underline font-medium"
                            title={evaluation.name}
                          >
                            <span className="truncate block" style={{ maxWidth: 220 }}>
                              {evaluation.name.length > 30
                                ? `${evaluation.name.substring(0, 30)}...`
                                : evaluation.name}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-gray-500 italic">
                            {evaluation.name}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm
                            ${evaluation.status === 'Completed'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : evaluation.status === 'in progress' || evaluation.status === 'open'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}
                          `}
                        >
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                        {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                        {evaluation.updatedAt ? new Date(evaluation.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {!evaluation.createdAt && evaluation.evaluation_id && (
                          <PatientEvaluationCreateModal 
                            patientId={patientId} 
                            evaluationId={evaluation.evaluation_id}
                            onSuccess={() => window.location.reload()} 
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}