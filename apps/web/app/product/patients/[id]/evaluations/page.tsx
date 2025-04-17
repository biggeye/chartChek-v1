// app/protected/patients/[id]/evaluations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePatientEvaluations } from '~/hooks/useEvaluations';

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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientEvaluations.map((evaluation) => (
                    <tr key={evaluation.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-small text-gray-900">
                        <Link href={`/protected/patients/${patientId}/evaluations/${evaluation.id}`} className="hover:text-blue-600 hover:underline">
                          {evaluation.name.length > 15 
                            ? `${evaluation.name.substring(0, 15)}...` 
                            : evaluation.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-small text-gray-500">
                        <span className={`px-2 inline-flex text-xxs leading-5 font-semibold rounded-full ${
                          evaluation.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          evaluation.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(evaluation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
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