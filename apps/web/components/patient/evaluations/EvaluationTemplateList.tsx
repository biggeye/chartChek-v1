import React from 'react';

interface EvaluationTemplate {
  id: string | number;
  name: string;
  description?: string;
}

export function EvaluationTemplateList({ templates }: { templates: any[] }) {
  if (!templates?.length) return <div>No templates found.</div>;
  return (
    <div>
      <h3 className="font-bold mb-2">Available Evaluation Templates</h3>
      <ul className="space-y-2">
        {templates.map(t => (
          <li key={t.id} className="p-2 rounded bg-gray-50 shadow">
            <b>{t.name}</b> {t.description ? <>— <span className="text-gray-500">{t.description}</span></> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
