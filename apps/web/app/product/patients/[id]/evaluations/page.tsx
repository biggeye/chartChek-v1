// app/product/patients/[id]/evaluations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import PatientEvaluationCreateModal from '~/components/patient/evaluations/CreatePatientEvaluation';

import Link from 'next/link';

export default function KipuPatientEvaluationsPage() {
  const { id: patientId } = useParams<{ id: string }>();

  const { patientEvaluations, isLoadingEvaluations, error } = usePatientEvaluations();



  if (isLoadingEvaluations) {
    return <div className="p-2">Loading evaluations...</div>;
  }

  if (error) {
    return <div className="p-2 text-red-500">Error loading evaluations: {error}</div>;
  }

  if (!patientEvaluations) {
    return <div className="p-2">No evaluations found for this patient.</div>;
  }
  
  const evaluationStats = [
    { id: 1, name: 'Total Evaluations', value: patientEvaluations.length },
    { id: 2, name: 'Completed', value: patientEvaluations.filter(e => e.status === 'Completed').length },
    { id: 3, name: 'In Progress', value: patientEvaluations.filter(e => e.status === 'in progress').length },
  ];

  return (
      <div className="bg-white shadow rounded-lg p-1">
        
        <div className="flex justify-end mb-2">
          <PatientEvaluationCreateModal patientId={patientId} onSuccess={() => window.location.reload()} />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-1 mb-2">
          {evaluationStats.map((stat) => (
            <div key={stat.id} className="bg-gray-50 p-1 rounded-lg">
              <p className="text-sm text-gray-500">{stat.name}</p>
              <p className="text-md font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Evaluations list */}
        <div className="mt-3">
          {patientEvaluations.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {patientEvaluations.map((evaluation, idx) => (
                    <tr
                      key={evaluation.id}
                      className={
                        idx % 2 === 0
                          ? 'bg-white hover:bg-blue-50 transition-colors'
                          : 'bg-gray-50 hover:bg-blue-50 transition-colors'
                      }
                    >
                      <td className="px-4 py-2 whitespace-normal text-gray-900 max-w-xs">
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
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm
                            ${evaluation.status === 'Completed'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : evaluation.status === 'in progress'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}
                          `}
                        >
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                        {new Date(evaluation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                        {evaluation.updatedAt ? new Date(evaluation.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>  
  );
}