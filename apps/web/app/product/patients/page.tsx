'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePatientStore } from '~/store/patient/patientStore';
import { PatientSearch } from '~/components/patient/PatientSearch';
import { PatientBreadcrumb } from '~/components/patient/PatientBreadcrumb';
import { useRouter } from 'next/navigation';
import { Loader } from '~/components/loading';
export default function PatientsPage() {
  const isLoadingPatients = usePatientStore((state => state.isLoadingPatients));
  const { patients, error } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Or whatever default you prefer

  const router = useRouter();

  // Zustand stores (pure state access, no actions)


  // Memoize sorted and filtered patients
  const filteredAndSortedPatients = useMemo(() => {
    if (!patients) return [];

    return patients
      .filter(patient => {
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
  }, [patients, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPatients.slice(startIndex, endIndex);
  }, [filteredAndSortedPatients, currentPage, itemsPerPage]);

  const handlePatientSelect = (patientId: string) => {
    router.push(`/product/patients/${patientId}`);
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
        <div className="flex justify-center items-center h-40 p-30">
          <Loader
          size="lg"
          showLogo={false}
          message="Loading patients..."
          />
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : filteredAndSortedPatients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {paginatedPatients.map(patient => (
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
                    <p className="text-xs text-gray-500">DOB: {patient.dateOfBirth} | MR: {patient.mrn}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
