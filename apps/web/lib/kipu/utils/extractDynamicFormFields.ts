// Utility: extractDynamicFormFields
// Drops a normalized, strictly-typed field descriptor array for dynamic form/LLM use.
// Edward Flinsticks, Esq. — accept no substitutes.

import type { KipuEvaluationItemObject, KipuFieldTypes } from '~/types/kipu/kipuAdapter';

/**
 * Normalizes a KIPU evaluation template into a dynamic field descriptor array.
 * This is the canonical programmatic interface for LLM-driven form generation.
 */
export function extractDynamicFormFields(
  items: KipuEvaluationItemObject[]
): Array<{
  id: string | number;
  label: string;
  fieldType: KipuFieldTypes;
  required: boolean;
  options?: Array<{ value: string | number; label: string }>;
  [key: string]: any; // For extensibility (e.g., min, max, helpText, etc)
}> {
  return items.map(item => {
    const { id, label, fieldType, required, options, ...rest } = item;
    // Only include options if they exist and are array-like
    const normalized = {
      id,
      label,
      fieldType,
      required: !!required,
      ...(Array.isArray(options) && options.length > 0 ? { options } : {}),
      ...rest,
    };
    return normalized;
  });
}
