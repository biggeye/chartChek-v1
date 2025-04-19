
"use client";

import { evaluationFieldComponents, MatrixField, extractContent } from "./patient-evaluation-items";
import { KipuPatientEvaluationItem } from "../types/kipu/kipuAdapter";

interface DocumentViewerProps {
  items?: KipuPatientEvaluationItem[];
}

export default function DocumentViewer({ items }: DocumentViewerProps) {
  if (!items || items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No evaluation items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-white rounded-2xl shadow-lg space-y-2">
      {items.map((item: KipuPatientEvaluationItem, idx) => {
        if (item.fieldType === 'matrix') {
          const previousItem = items[idx - 1];
          const prevAnswer = extractContent(previousItem)?.toLowerCase();
          const previousAnswerYes = prevAnswer === 'yes';

          return previousAnswerYes ? (
            <div key={item.id}>
              <MatrixField item={item} previousAnswerYes={previousAnswerYes} />
              {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />} 
            </div>
          ) : null;
        } else {
          const Component = evaluationFieldComponents[item.fieldType] || evaluationFieldComponents.default;

          if (!Component) {
            console.error(`No component found for field type: ${item.fieldType}`);
            return null; 
          }

          return (
            <div key={item.id}>
              <Component {...item} />
              {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />} 
            </div>
          );
        }
      })}
    </div>
  );
}