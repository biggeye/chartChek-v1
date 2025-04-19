// app/product/patients/[id]/vitals/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientVitalSign } from 'types/kipu/kipuAdapter';
import { usePatientStore } from '~/store/patient/patientStore';
// Define a local interface for formatted vital signs
interface VitalSign {
  id: string;
  type: 'temperature' | 'blood_pressure' | 'heart_rate' | 'respiratory_rate' | 'oxygen_saturation' | 'weight' | 'height' | 'bmi' | 'other';
  value: string | number;
  unit: string;
  timestamp: string;
  patient_id: string;
}

export default function PatientVitalsPage() {
  const { id: patientId } = useParams<{ id: string }>();


  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedType, setSelectedType] = useState<string | null>(null);
/*
  useEffect(() => {
    const formattedVitalSigns = currentPatientVitalSigns.map((vital: PatientVitalSign) => {
      // Determine the type based on available data
      let type: VitalSign['type'] = 'other';
  
      if (vital.type === 'temperature') type = 'temperature';
      else if (vital.type === 'blood_pressure') type = 'blood_pressure';
      else if (vital.type === 'heart_rate') type = 'heart_rate';
      else if (vital.type === 'respiratory_rate') type = 'respiratory_rate';
      else if (vital.type === 'oxygen_saturation') type = 'oxygen_saturation';
      else if (vital.type === 'weight') type = 'weight';
      else if (vital.type === 'height') type = 'height';
      else if (vital.type === 'bmi') type = 'bmi';
  
      return {
        id: String(vital.id || ''),
        type,
        value: vital.value || '',
        unit: vital.unit || '',
        timestamp: vital.recordedAt || '',
        patient_id: String(vital.patientId || '')
      };
    });
    setVitalSigns(formattedVitalSigns);
  }, [currentPatientVitalSigns]); // Add dependency on patientVitalSigns
*/
  // Filter vital signs based on selected time range
  const filteredVitalSigns = vitalSigns.filter(vital => {
    const vitalDate = new Date(vital.timestamp);
    const now = new Date();

    if (timeRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return vitalDate >= oneWeekAgo;
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return vitalDate >= oneMonthAgo;
    } else if (timeRange === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return vitalDate >= oneYearAgo;
    }

    return true;
  });

  // Further filter by selected type if one is selected
  const displayedVitalSigns = selectedType
    ? filteredVitalSigns.filter(vital => vital.type === selectedType)
    : filteredVitalSigns;

  // Get unique vital sign types for the filter
  const vitalSignTypes = Array.from(new Set(vitalSigns.map(vital => vital.type)));


  return (
    <div className="space-y-6 p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Vital Signs</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label htmlFor="vital-type" className="block text-sm font-medium text-gray-700 mb-1">Vital Sign Type</label>
            <select
              id="vital-type"
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              {vitalSignTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vital Signs Table */}
        {displayedVitalSigns.length === 0 ? (
          <p className="text-gray-500">No vital signs available for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Recorded</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedVitalSigns.map((vital) => (
                  <tr key={vital.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vital.type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vital.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vital.timestamp).toLocaleString()}
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