// types/templates.ts
export interface ChartChekTemplate {
    id: string;
    name: string;
    version: string;
    description: string;
    sourceSystem?: string; // e.g., "KIPU", "ChartChek"
    targetSystems: string[]; // e.g., ["KIPU", "ChartChek"]
    fields: TemplateField[];
    transformations: TemplateTransformation[];
    validationRules: ValidationRule[];
  }
  
// Update the TemplateField interface
export interface TemplateField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
  order?: number;
  options?: string | string[] | Array<{label: string, value: string}>;
  conditionalLogic?: string | {
    dependsOn: string;
    condition: string;
    value: any;
    original: any;
  };
  mappings: {
    [systemName: string]: any; // Maps to field names in other systems
  };
}
  
  export interface TemplateTransformation {
    id: string;
    sourceField: string;
    targetField: string;
    transformationType: string; // e.g., "map", "convert", "format"
    transformationOptions?: Record<string, any>;
  }
  
  export interface ValidationRule {
    id: string;
    field: string;
    ruleType: string; // e.g., "required", "format", "range"
    errorMessage: string;
    parameters?: Record<string, any>;
  }