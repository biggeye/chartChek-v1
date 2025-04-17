// app/protected/patients/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import { usePatientStore } from '~/store/patient/patientStore';

export default function PatientPage() {

  const { 
    selectedPatient, 
  } = usePatientStore();

  if (!selectedPatient) {
    return <div>No patient selected or found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Patient Information Section */}
      <div>
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Full Name</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.fullName ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">MRN</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.mrn ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Date of Birth</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.dateOfBirth ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Gender</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.gender ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Age</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.age ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Admission Date</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.admissionDate ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Discharge Date</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.dischargeDate ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Status</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.status ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Location</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.locationName ? `${selectedPatient.locationName} / ${selectedPatient.buildingName ?? ''} / ${selectedPatient.roomName ?? ''} / ${selectedPatient.bedName ?? ''}` : 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Program</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.program ?? 'N/A'}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Level of Care</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">{selectedPatient.levelOfCare ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
      {/* Add other dashboard components here if needed */}
    </div>
  );
}