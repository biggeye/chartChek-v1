import React from 'react';

interface Evaluation {
  id: string | number;
  status?: string;
  [key: string]: any;
}

export function EvaluationCreated({ evaluation }: { evaluation: any }) {
  return (
    <div className="p-4 bg-green-50 rounded shadow">
      <b>Evaluation Created!</b>
      <div>ID: {evaluation.id}</div>
      {evaluation.status && <div>Status: {evaluation.status}</div>}
    </div>
  );
}
