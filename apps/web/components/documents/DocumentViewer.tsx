"use client";

import { evaluationFieldComponents, MatrixField, extractContent } from "../patient/evaluations/PatientEvaluationItems";
import { KipuPatientEvaluationItem } from "~/types/kipu/kipuAdapter";
import { logger } from '~/lib/logger';
import { useEffect } from 'react';

interface DocumentViewerProps {
  items?: KipuPatientEvaluationItem[];
}

export default function DocumentViewer({ items }: DocumentViewerProps) {
  logger.info('[DocumentViewer] Initializing viewer', { 
    itemCount: items?.length ?? 0 
  })

  useEffect(() => {
    if (items?.length) {
      logger.debug('[DocumentViewer] Processing evaluation items', {
        itemCount: items.length,
        itemTypes: items.map(item => item.fieldType)
      })
    }
  }, [items])

  if (!items || items.length === 0) {
    logger.info('[DocumentViewer] No items to display')
    return (
      <div className="space-y-6">
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No evaluation items to display</p>
        </div>
      </div>
    );
  }

  logger.info('[DocumentViewer] Rendering evaluation items', {
    itemCount: items.length
  })

  return (
    <div className="p-2 bg-white rounded-2xl shadow-lg space-y-2">
      {items.map((item: KipuPatientEvaluationItem, idx) => {
        if (item.fieldType === 'matrix') {
          const previousItem = items[idx - 1];
          const prevAnswer = extractContent(previousItem)?.toLowerCase();
          const previousAnswerYes = prevAnswer === 'yes';

          logger.debug('[DocumentViewer] Processing matrix field', {
            itemId: item.id,
            previousAnswer: prevAnswer,
            shouldRender: previousAnswerYes
          })

          return previousAnswerYes ? (
            <div key={item.id}>
              <MatrixField item={item} previousAnswerYes={previousAnswerYes} />
              {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />} 
            </div>
          ) : null;
        } else {
          const Component = evaluationFieldComponents[item.fieldType] || evaluationFieldComponents.default;

          if (!Component) {
            logger.error('[DocumentViewer] No component found for field type', {
              fieldType: item.fieldType,
              itemId: item.id
            })
            return null; 
          }

          logger.debug('[DocumentViewer] Rendering field component', {
            itemId: item.id,
            fieldType: item.fieldType,
            componentName: Component.displayName || Component.name
          })

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