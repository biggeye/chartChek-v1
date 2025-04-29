import React from 'react';
import DocumentViewer from '~/components/documents/DocumentViewer';
import { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';

export function PatientEvaluationViewer
({ evaluations }: { evaluations: any[] }) {
  if (!evaluations?.length) return <div>No evaluations found.</div>;
  return (
    <div>
      <h3 className="font-bold mb-2">Patient Evaluations</h3>
      {evaluations.map(ev => (
        <div key={ev.id} className="my-4">
          <DocumentViewer items={ev.patientEvaluationItems} />
        </div>
      ))}
    </div>
  );
}
