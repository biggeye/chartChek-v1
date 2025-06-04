import { KipuEvaluation, KipuEvaluationItemObject } from '~/types/kipu/kipuAdapter';
import { snakeToCamel } from '~/utils/case-converters';

/**
 * Transforms a KIPU evaluation template into the format expected by our viewer components
 */
export function transformKipuTemplate(template: KipuEvaluation): KipuEvaluation {
  console.log('🔄 [Transform] Starting template transformation:', {
    hasTemplate: !!template,
    templateKeys: template ? Object.keys(template) : [],
    evaluationItems: template?.evaluationItems ? `Array(${template.evaluationItems.length})` : 'none',
    items: template?.items ? `Array(${template.items.length})` : 'none'
  });

  if (!template) return template;

  // Get the items array from either evaluationItems or items
  const items = template.evaluationItems || template.items || [];
  console.log('📦 [Transform] Found items:', {
    source: template.evaluationItems ? 'evaluationItems' : template.items ? 'items' : 'none',
    count: items.length,
    firstItem: items[0] ? {
      id: items[0].id,
      fieldType: items[0].fieldType,
      label: items[0].label
    } : null
  });

  // Transform the evaluation items to match our expected format
  const transformedItems = items.map(item => {
    const transformedItem: KipuEvaluationItemObject = {
      id: item.id,
      fieldType: item.fieldType,
      name: item.name,
      recordNames: item.recordNames || '',
      columnNames: item.columnNames || '',
      label: item.label,
      enabled: true,
      optional: item.optional || false,
      evaluationId: item.evaluationId,
      defaultValue: item.defaultValue || '',
      dividerBelow: item.dividerBelow || false,
      rule: item.rule || '',
      placeholder: item.placeholder || '',
      prePopulateWithId: item.prePopulateWithId || 0,
      parentItemId: item.parentItemId || '',
      conditions: item.conditions || '',
      labelWidth: item.labelWidth || '',
      itemGroup: item.itemGroup || '',
      showString: item.showString || '',
      showStringCss: item.showStringCss || '',
      matrixDefaultRecords: item.matrixDefaultRecords || 0,
      cssStyle: item.cssStyle || '',
      image: item.image,
      skipValidations: item.skipValidations,
      records: item.records || []
    };

    return transformedItem;
  });

  const result = {
    ...template,
    evaluationItems: transformedItems
  };

  console.log('✅ [Transform] Transformation complete:', {
    hasResult: !!result,
    resultKeys: Object.keys(result),
    evaluationItems: result.evaluationItems ? `Array(${result.evaluationItems.length})` : 'none',
    firstTransformedItem: result.evaluationItems?.[0] ? {
      id: result.evaluationItems[0].id,
      fieldType: result.evaluationItems[0].fieldType,
      label: result.evaluationItems[0].label
    } : null
  });

  return result;
} 