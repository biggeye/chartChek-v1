// /lib/forms/kipuEvaluationAdapter.ts
import { ChartChekTemplate, TemplateField } from 'types/store/doc/templates';

// If these types don't exist, define them inline


/**
 * Converts a KIPU evaluation template to a ChartChekTemplate format
 */
export function adaptKipuEvaluationToTemplate(kipuEvaluation: any): ChartChekTemplate {
  if (!kipuEvaluation) {
    return {} as ChartChekTemplate; // Return empty template instead of null
  }

  // Extract basic template info based on your actual Template structure
  const template: any = {
    id: `kipu-${kipuEvaluation.id}`,
    name: kipuEvaluation.name || 'Imported KIPU Template',
    description: kipuEvaluation.description || '',
    version: '1.0',
    createdDate: new Date().toISOString(), // Use your actual field names
    updatedDate: new Date().toISOString(),
    type: 'evaluation',
    status: 'draft',
    sections: [],
    metadata: {
      source: 'kipu',
      originalId: kipuEvaluation.id,
      kipu_type: kipuEvaluation.evaluation_type || 'standard'
    }
  };

  // Process sections and fields - adapt field structure to match your Template type
  if (kipuEvaluation.sections && Array.isArray(kipuEvaluation.sections)) {
    template.sections = kipuEvaluation.sections.map((section: any, sectionIndex: number) => {
      const templateSection = {
        id: `section-${sectionIndex}`,
        title: section.name || `Section ${sectionIndex + 1}`,
        description: section.description || '',
        order: sectionIndex,
        fields: []
      };

      // Process fields within the section
      if (section.fields && Array.isArray(section.fields)) {
        templateSection.fields = section.fields.map((field: any, fieldIndex: number) => {
          return mapKipuFieldToTemplateField(field, fieldIndex);
        });
      } else if (section.items && Array.isArray(section.items)) {
        templateSection.fields = section.items.map((item: any, itemIndex: number) => {
          return mapKipuFieldToTemplateField(item, itemIndex);
        });
      }

      return templateSection;
    });
  } else if (kipuEvaluation.items && Array.isArray(kipuEvaluation.items)) {
    template.sections = [{
      id: 'section-default',
      title: 'Main Section',
      description: '',
      order: 0,
      fields: kipuEvaluation.items.map((item: any, itemIndex: number) => {
        return mapKipuFieldToTemplateField(item, itemIndex);
      })
    }];
  }

  return template as ChartChekTemplate;
}

/**
 * Maps a KIPU field to a TemplateField format
 */
function mapKipuFieldToTemplateField(kipuField: any, index: number): TemplateField {
  // Map KIPU field types to our application's field types
  const fieldTypeMap: Record<string, string> = {
    'text': 'text',
    'textarea': 'textarea',
    'number': 'text',
    'select': 'select',
    'checkbox': 'checkbox',
    'check_box': 'checkbox',
    'check_box_first_value_none': 'checkbox',
    'radio_buttons': 'radio',
    'radio': 'radio',
    'date': 'date',
    'datetime': 'date',
    'evaluation_datetime': 'date',
    'title': 'title',
    'object': 'textarea',
    'string': 'text',
    'matrix': 'select',
  };

  const mappedType = fieldTypeMap[kipuField.field_type || kipuField.type] || 'text';
  
  // Adjust field structure to match your actual TemplateField type
  const templateField: TemplateField = {
    id: `field-${index}`,
    name: kipuField.name || kipuField.label || `Field ${index + 1}`,
    type: mappedType,
    required: kipuField.required === true,
    order: index,
    defaultValue: kipuField.default_value || kipuField.defaultValue || '',
    description: kipuField.description || kipuField.help_text || '',
    mappings: {
      original_kipu_field: kipuField,
      field_type: kipuField.field_type || kipuField.type
    }
  };

  // Handle options for select, radio, checkbox types
  if (['select', 'radio', 'checkbox'].includes(mappedType)) {
    templateField.options = parseKipuOptions(kipuField);
  }

  // Handle conditional logic/visibility
  if (kipuField.conditional_logic || kipuField.visible_if) {
    templateField.conditionalLogic = {
      dependsOn: kipuField.depends_on_field || '',
      condition: 'equals',
      value: kipuField.depends_on_value || '',
      original: kipuField.conditional_logic || kipuField.visible_if
    };
  }

  return templateField;
}

/**
 * Parses options from KIPU field formats
 */
function parseKipuOptions(kipuField: any): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  
  if (kipuField.options && Array.isArray(kipuField.options)) {
    return kipuField.options.map((opt: any) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      } else if (typeof opt === 'object') {
        return { 
          label: opt.label || opt.name || opt.value || '', 
          value: opt.value || opt.id || opt.label || ''
        };
      }
      return { label: String(opt), value: String(opt) };
    });
  } else if (kipuField.values && Array.isArray(kipuField.values)) {
    return kipuField.values.map((val: any) => {
      if (typeof val === 'string') {
        return { label: val, value: val };
      } else if (typeof val === 'object') {
        return { 
          label: val.label || val.name || val.value || '', 
          value: val.value || val.id || val.label || ''
        };
      }
      return { label: String(val), value: String(val) };
    });
  }
  
  return options;
}