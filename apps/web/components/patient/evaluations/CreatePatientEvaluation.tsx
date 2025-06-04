// Modal for creating a new patient evaluation, dynamically generates fields from selected template
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { evaluationFieldComponents, getFieldComponent } from './PatientEvaluationItems';
import { useTemplateStore } from '~/store/doc/templateStore';
import { PatientEvaluationItem } from '~/types/chat';
import { KipuEvaluationItemObject } from '~/types/kipu/kipuAdapter';

// Types for evaluation templates and items
interface EvaluationTemplate {
  id: string;
  name: string;
  items: PatientEvaluationItem[];
}

interface PatientEvaluationCreateModalProps {
  patientId: string;
  evaluationId?: string;
  onSuccess: () => void;
}

// Enhanced field components for form input (editable versions)
const EditableTextField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => (
  <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
    <label className="block text-sm font-medium text-gray-800">{item.label}</label>
    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
    <input
      type="text"
      className="w-full border rounded p-2 text-sm"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={item.placeholder || `Enter ${item.label}`}
    />
  </div>
);

const EditableTextareaField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => (
  <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
    <label className="block text-sm font-medium text-gray-800">{item.label}</label>
    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
    <textarea
      className="w-full border rounded p-2 text-sm"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={item.placeholder || `Enter ${item.label}`}
      rows={3}
    />
  </div>
);

const EditableDateField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => (
  <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
    <label className="block text-sm font-medium text-gray-800">{item.label}</label>
    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
    <input
      type="datetime-local"
      className="w-full border rounded p-2 text-sm"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const EditableCheckboxField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => {
  const options = item.records || [];
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
      <label className="block text-sm font-medium text-gray-800">{item.label}</label>
      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
      <div className="space-y-2">
        {options.map((option: any, idx: number) => (
          <label key={idx} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(String(option.value || option.label))}
              onChange={e => {
                const val = String(option.value || option.label);
                const newValues = e.target.checked 
                  ? [...selectedValues, val]
                  : selectedValues.filter(v => v !== val);
                onChange(newValues);
              }}
              className="rounded"
            />
            <span className="text-sm">{option.label}</span>
            {option.description && option.description !== 'n/a' && (
              <span className="text-xs text-gray-400">({option.description})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

const EditableRadioField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => {
  const options = item.records || [];

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
      <label className="block text-sm font-medium text-gray-800">{item.label}</label>
      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
      <div className="space-y-2">
        {options.map((option: any, idx: number) => (
          <label key={idx} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`radio-${item.id}`}
              checked={value === String(option.value || option.label)}
              onChange={() => onChange(String(option.value || option.label))}
              className="rounded"
            />
            <span className="text-sm">{option.label}</span>
            {option.description && option.description !== 'n/a' && (
              <span className="text-xs text-gray-400">({option.description})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

const EditableFileField = ({ item, value, onChange }: { item: any, value: any, onChange: (value: any) => void }) => (
  <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
    <label className="block text-sm font-medium text-gray-800">{item.label}</label>
    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
    <input
      type="file"
      className="w-full border rounded p-2 text-sm"
      onChange={e => onChange(e.target.files?.[0] || null)}
    />
    {value && <p className="text-xs text-green-600">File selected: {value.name}</p>}
  </div>
);

const EditableTitleField = ({ item }: { item: any }) => (
  <h3 className="text-lg font-bold text-indigo-700 border-b pb-2 mb-2" 
      dangerouslySetInnerHTML={{ __html: item.label }} />
);

// Mapping for editable field components
const editableFieldComponents: Record<string, React.ComponentType<any>> = {
  text: EditableTextField,
  textarea: EditableTextareaField,
  number: EditableTextField,
  select: EditableTextField, // Could be enhanced to actual select
  checkbox: EditableCheckboxField,
  check_box: EditableCheckboxField,
  check_box_first_value_none: EditableCheckboxField,
  radio_buttons: EditableRadioField,
  radio: EditableRadioField,
  date: EditableDateField,
  datetime: EditableDateField,
  evaluation_datetime: EditableDateField,
  title: EditableTitleField,
  file: EditableFileField,
  attachment: EditableFileField,
  string: EditableTextField,
  // Add more KIPU-specific field types
  points_item: EditableTextField,
  points_total: EditableTextField,
  matrix: EditableTextareaField, // Matrix fields could be enhanced later
  'patient.drug_of_choice': EditableTextareaField,
  'patient.diagnosis_code': EditableTextareaField,
  problem_list: EditableTextareaField,
  golden_thread_tag: () => null, // Skip rendering this type
};

const getEditableFieldComponent = (fieldType: string) => {
  return editableFieldComponents[fieldType] || EditableTextField;
};

// Helper function to transform KIPU evaluation items to our expected format
const transformKipuItem = (kipuItem: any) => {
  const transformed = { ...kipuItem };
  
  // Convert recordNames pipe-separated string to records array
  if (kipuItem.recordNames && typeof kipuItem.recordNames === 'string') {
    const recordNames = kipuItem.recordNames.split('|').filter((name: string) => name.trim());
    transformed.records = recordNames.map((name: string) => ({
      label: name.trim(),
      value: name.trim(),
      description: 'n/a' // Default description
    }));
  }
  
  // Normalize field types for our components
  const fieldTypeMap: Record<string, string> = {
    'check_box': 'checkbox',
    'check_box_first_value_none': 'checkbox',
    'radio_buttons': 'radio',
    'evaluation_datetime': 'datetime',
    'evaluation_date': 'date',
    'string': 'text',
    'points_item': 'text',
    'points_total': 'text',
    'text': 'text',
    'textarea': 'textarea',
    'title': 'title',
    'file': 'file',
    'attachment': 'file',
    'matrix': 'textarea',
    'patient.drug_of_choice': 'textarea',
    'patient.diagnosis_code': 'textarea',
    'problem_list': 'textarea',
    'golden_thread_tag': 'golden_thread_tag'
  };
  
  // Map the field type, defaulting to text if unknown
  transformed.fieldType = fieldTypeMap[kipuItem.fieldType] || 'text';
  
  // Special handling for title fields
  if (kipuItem.fieldType === 'title') {
    transformed.label = kipuItem.label || kipuItem.name;
  }
  
  return transformed;
};

export default function PatientEvaluationCreateModal({ patientId, evaluationId, onSuccess }: PatientEvaluationCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Zustand template store
  const {
    kipuTemplates,
    isLoadingKipuTemplates,
    error,
    fetchKipuTemplates,
    fetchKipuTemplate,
    selectedKipuTemplate,
    setSelectedKipuTemplate,
  } = useTemplateStore();

  // Handle template select
  const handleTemplateSelect = useCallback(async (id: string) => {
    // Fetch the full template (with items) from the store
    await fetchKipuTemplate(Number(id));
  }, [fetchKipuTemplate]);

  // Fetch templates on open (always refetch)
  useEffect(() => {
    if (open) {
      fetchKipuTemplates();
      setFormState({});
      // If evaluationId is provided, automatically select that template
      if (evaluationId) {
        handleTemplateSelect(evaluationId);
      }
    }
  }, [open, fetchKipuTemplates, evaluationId, handleTemplateSelect]);

  // Reset template when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedKipuTemplate(null);
      setFormState({});
    }
  }, [open, setSelectedKipuTemplate]);

  // Use selectedKipuTemplate for form rendering
  const template = selectedKipuTemplate;

  // Debug: Check what items field is available - comprehensive analysis
  const templateAny = template as any; // Type as any for debugging unknown structure
  
  // First check if data is wrapped in an evaluation object
  const evaluation = templateAny?.evaluation;
  const possibleItemFields = {
    'evaluation.evaluationItems': evaluation?.evaluationItems,
    'evaluation.items': evaluation?.items,
    'evaluation.patientEvaluationItems': evaluation?.patientEvaluationItems,
    'evaluation.evaluation_items': evaluation?.evaluation_items,
    'evaluation.template_items': evaluation?.template_items,
    items: templateAny?.items,
    evaluationItems: templateAny?.evaluationItems,
    patientEvaluationItems: templateAny?.patientEvaluationItems,
    evaluation_items: templateAny?.evaluation_items,
    template_items: templateAny?.template_items
  };
  
  // Find the actual items array - check evaluation object first, then root level
  const templateItems = evaluation?.evaluationItems || 
                       evaluation?.items || 
                       evaluation?.patientEvaluationItems || 
                       evaluation?.evaluation_items ||
                       evaluation?.template_items ||
                       templateAny?.items || 
                       templateAny?.evaluationItems || 
                       templateAny?.patientEvaluationItems || 
                       templateAny?.evaluation_items ||
                       templateAny?.template_items ||
                       [];
  
  console.log('[Modal] Comprehensive Template Analysis:', {
    hasTemplate: !!template,
    templateId: template?.id || evaluation?.id,
    templateName: template?.name || evaluation?.name,
    templateKeys: template ? Object.keys(template) : [],
    evaluationKeys: evaluation ? Object.keys(evaluation) : [],
    possibleItemFields: Object.keys(possibleItemFields).map(key => ({
      field: key,
      exists: !!(possibleItemFields as any)[key],
      isArray: Array.isArray((possibleItemFields as any)[key]),
      length: Array.isArray((possibleItemFields as any)[key]) ? (possibleItemFields as any)[key].length : 0
    })),
    actualItemsCount: templateItems.length,
    itemsFieldUsed: evaluation?.evaluationItems ? 'evaluation.evaluationItems' :
                   evaluation?.items ? 'evaluation.items' : 
                   evaluation?.patientEvaluationItems ? 'evaluation.patientEvaluationItems' :
                   evaluation?.evaluation_items ? 'evaluation.evaluation_items' :
                   evaluation?.template_items ? 'evaluation.template_items' :
                   templateAny?.items ? 'items' : 
                   templateAny?.evaluationItems ? 'evaluationItems' : 
                   templateAny?.patientEvaluationItems ? 'patientEvaluationItems' :
                   templateAny?.evaluation_items ? 'evaluation_items' :
                   templateAny?.template_items ? 'template_items' : 'none',
    firstItemSample: templateItems[0] ? {
      id: templateItems[0].id,
      label: templateItems[0].label,
      fieldType: templateItems[0].fieldType,
      keys: Object.keys(templateItems[0]),
      hasRecords: !!(templateItems[0] as any).records
    } : null,
    rawTemplateData: template // Full object for inspection
  });

  // Handle input changes
  const handleChange = (key: string, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Enhanced ID resolution
      const possibleIds = [
        template?.id,
        (template as any)?.evaluation?.id,
        (template as any)?.templateId,
        (template as any)?.evaluationId,
        (template as any)?.evaluation_id,
        (template as any)?.id,
      ].filter(id => id !== undefined && id !== null && id !== '');
      
      if (possibleIds.length === 0) {
        console.error('[Submit] No template ID found');
        alert('No template ID found. Please select a template first.');
        return;
      }
      
      const evaluationId = String(possibleIds[0]);
      
      // Build FormData
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('evaluationId', evaluationId);
      formData.append('notes', formState.notes || '');
      
      // Build items array
      const items = templateItems.map((item: any, idx: number) => {
        const value = formState[item.id];
        return {
          id: String(item.id),
          fieldType: String(item.fieldType),
          value: (String(item.fieldType) === 'file' || String(item.fieldType) === 'attachment') ? undefined : value,
        };
      });
      
      formData.append('items', JSON.stringify(items));
      
      // Attach files
      templateItems.forEach((item: any, idx: number) => {
        if ((String(item.fieldType) === 'file' || String(item.fieldType) === 'attachment') && formState[item.id] instanceof File) {
          formData.append(`items.${idx}.value`, formState[item.id]);
        }
      });
      
      const res = await fetch(`/api/kipu/patients/${patientId}/evaluations`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create evaluation: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const result = await res.json().catch(() => null);
      
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error('[Submit] Error creating evaluation:', err);
      alert(`Failed to create evaluation: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-8 h-8 p-0">+</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Evaluation</DialogTitle>
          {template && (
            <p className="text-sm text-gray-600 mt-1">
              Template: <span className="font-medium">{template.name}</span>
              {templateItems.length > 0 && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {templateItems.length} fields
                </span>
              )}
            </p>
          )}
        </DialogHeader>
        
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        
        {!template ? (
          <div>
            <label className="block mb-2 text-sm font-medium">Select Template</label>
            {isLoadingKipuTemplates && !error ? (
              <div className="text-gray-400 text-sm">Loading templates...</div>
            ) : (
              <select
                className="w-full border rounded p-2"
                onChange={e => handleTemplateSelect(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select...</option>
                {kipuTemplates.map(tpl => (
                  <option key={tpl.id} value={String(tpl.id)}>{tpl.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div>
            {/* Loading state for template details */}
            {isLoadingKipuTemplates ? (
              <div className="flex items-center gap-2 p-4 text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Loading template details...
              </div>
            ) : templateItems.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  This template appears to have no form fields. This might be a metadata-only template.
                </p>
                <div className="mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedKipuTemplate(null)}
                  >
                    Choose Different Template
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg border p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                  {templateItems.map((item: KipuEvaluationItemObject, idx: number) => {
                    // Transform KIPU item to our expected format
                    const transformedItem = transformKipuItem(item);
                    const fieldType = String(transformedItem.fieldType);
                    const EditableComponent = getEditableFieldComponent(fieldType);
                    
                    // Skip rendering certain field types
                    if (fieldType === 'golden_thread_tag') {
                      return null;
                    }
                    
                    return (
                      <div key={String(item.id)}>
                        <EditableComponent
                          item={transformedItem}
                          value={formState[item.id]}
                          onChange={(value: any) => handleChange(String(item.id), value)}
                        />
                        {item.dividerBelow && <hr className="border-dashed border-gray-300 my-4" />}
                      </div>
                    );
                  })}
                </div>
                
                {/* Optional notes field */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-1">Additional Notes (Optional)</label>
                  <textarea
                    className="block w-full border rounded p-2"
                    value={formState.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    disabled={submitting}
                    placeholder="Add any additional notes or comments..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Evaluation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}