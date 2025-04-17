'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { usePatientStore } from '~/store/patient/patientStore';
import { useFetchPatients } from '~/hooks/usePatients';
import { PatientSearch } from '~/components/patient/PatientSearch';
import { PatientBreadcrumb } from '~/components/patient/PatientBreadcrumb';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });

  const router = useRouter();

  // Zustand stores (pure state access, no actions)
  const { currentFacilityId } = useFacilityStore();
  const { patients, isLoadingPatients, error } = usePatientStore();

  // Use the new hook for fetching patients
  useFetchPatients(currentFacilityId);

  // Memoize sorted and filtered patients
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    return patients
      .filter(patient => {
        // Facility filter
        if (patient.facilityId !== currentFacilityId) return false;

        // Search filter
        const matchesSearch =
          searchQuery.trim() === '' ||
          patient.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filter
        const admissionDate = patient.admissionDate ? new Date(patient.admissionDate) : null;
        let matchesDateRange = true;

        if (admissionDate && (dateRange.start || dateRange.end)) {
          if (dateRange.start && admissionDate < new Date(dateRange.start)) {
            matchesDateRange = false;
          }
          if (dateRange.end && admissionDate > new Date(dateRange.end)) {
            matchesDateRange = false;
          }
        }

        return matchesSearch && matchesDateRange;
      })
      .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  }, [patients, searchQuery, dateRange, currentFacilityId]);

  const handlePatientSelect = (patientId: string) => {
    router.push(`/protected/patients/${patientId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <PatientBreadcrumb
        actionButtons={
          <PatientSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        }
      />

      {isLoadingPatients ? (
        <div className="flex justify-center items-center h-40">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : filteredPatients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {filteredPatients.map(patient => (
            <li
              key={patient.patientId}
              className="py-2 cursor-pointer hover:bg-gray-50"
              onClick={() => handlePatientSelect(patient.patientId)}
            >
              <div className="flex items-center">
                <div>
                  <p className="font-sm">
                    {patient.lastName ? patient.lastName.charAt(0) : ''}, {patient.firstName}
                  </p>
                  <p className="text-xs text-gray-500">DOB: {patient.dateOfBirth}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
