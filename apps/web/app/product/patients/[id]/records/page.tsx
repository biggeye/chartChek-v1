import { Suspense } from "react";
import { PatientRecordsClient } from "~/components/patient/patient-records";

interface PatientRecordsPageProps {
  params: { id: string };
}

export default function PatientRecordsPage({ params }: PatientRecordsPageProps) {
  // Extract patientId from route params
  const { id: patientId } = params;
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Patient Records</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <PatientRecordsClient patientId={patientId} />
      </Suspense>
    </div>
  );
}

