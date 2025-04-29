// Modal for creating a new patient evaluation, dynamically generates fields from selected template
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { evaluationFieldComponents } from './PatientEvaluationItems';
import { useTemplateStore } from '~/store/doc/templateStore';
import { PatientEvaluationItem } from '~/types/chat';

// Types for evaluation templates and items
interface EvaluationTemplate {
  id: string;
  name: string;
  items: PatientEvaluationItem[];
}

interface PatientEvaluationCreateModalProps {
  patientId: string;
  onSuccess: () => void;
}

export default function PatientEvaluationCreateModal({ patientId, onSuccess }: PatientEvaluationCreateModalProps) {
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
  } = useTemplateStore();

  // Fetch templates on open (always refetch)
  useEffect(() => {
    if (open) {
      fetchKipuTemplates();
      setFormState({});
    }
  }, [open, fetchKipuTemplates]);

  // Handle template select
  const handleTemplateSelect = async (id: string) => {
    // Fetch the full template (with items) from the store
    await fetchKipuTemplate(Number(id));
  };

  // Use selectedKipuTemplate for form rendering
  const template = selectedKipuTemplate;

  // Handle input changes
  const handleChange = (key: string, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  // Handle file input
  const handleFileChange = (key: string, file: File | null) => {
    setFormState(prev => ({ ...prev, [key]: file }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build FormData
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('evaluationId', template?.id ? String(template.id) : '');
      formData.append('notes', formState.notes || '');
      // Build items array
      const items = (template?.items || []).map((item: any, idx: number) => {
        const value = formState[item.id];
        return {
          id: String(item.id),
          fieldType: String(item.fieldType),
          value: (String(item.fieldType) === 'file' || String(item.fieldType) === 'attachment') ? undefined : value,
        };
      });
      formData.append('items', JSON.stringify(items));
      // Attach files
      (template?.items || []).forEach((item: any, idx: number) => {
        if ((String(item.fieldType) === 'file' || String(item.fieldType) === 'attachment') && formState[item.id] instanceof File) {
          formData.append(`items.${idx}.value`, formState[item.id]);
        }
      });
      const res = await fetch('/api/kipu/patient_evaluations', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to create evaluation');
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      // Optionally handle error UI here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">New Evaluation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Evaluation</DialogTitle>
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
          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {(template.items || []).map((item, idx) => {
              // Render field based on type
              const fieldType = String(item.fieldType);
              // Fix: Only use item.options if it exists, otherwise fallback to item.records or []
              const options = Array.isArray((item as any).options)
                ? (item as any).options
                : Array.isArray((item as any).records)
                  ? (item as any).records
                  : [];
              if (fieldType === 'file' || fieldType === 'attachment') {
                return (
                  <div key={String(item.id)}>
                    <label className="block text-sm font-medium mb-1">{item.label}</label>
                    <input
                      type="file"
                      className="block w-full border rounded p-2"
                      onChange={e => handleFileChange(String(item.id), e.target.files?.[0] || null)}
                      disabled={submitting}
                    />
                  </div>
                );
              }
              if (fieldType === 'radio' || fieldType === 'radio_buttons') {
                return (
                  <div key={String(item.id)}>
                    <label className="block text-sm font-medium mb-1">{item.label}</label>
                    <div className="flex gap-2">
                      {options.map((opt: any) => (
                        <label key={String(opt.value)} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={String(item.id)}
                            value={String(opt.value)}
                            checked={String(formState[String(item.id)]) === String(opt.value)}
                            onChange={() => handleChange(String(item.id), opt.value)}
                            disabled={submitting}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
              if (
                fieldType === 'checkbox' ||
                fieldType === 'check_box' ||
                fieldType === 'check_box_first_value_none'
              ) {
                return (
                  <div key={String(item.id)}>
                    <label className="block text-sm font-medium mb-1">{item.label}</label>
                    <div className="flex gap-2 flex-wrap">
                      {options.map((opt: any) => (
                        <label key={String(opt.value)} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            name={String(item.id)}
                            value={String(opt.value)}
                            checked={Array.isArray(formState[String(item.id)]) && formState[String(item.id)].map(String).includes(String(opt.value))}
                            onChange={e => {
                              const arr = Array.isArray(formState[String(item.id)]) ? [...formState[String(item.id)].map(String)] : [];
                              if (e.target.checked) arr.push(String(opt.value));
                              else arr.splice(arr.indexOf(String(opt.value)), 1);
                              handleChange(String(item.id), arr);
                            }}
                            disabled={submitting}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
              if (fieldType === 'textarea') {
                return (
                  <div key={String(item.id)}>
                    <label className="block text-sm font-medium mb-1">{item.label}</label>
                    <textarea
                      className="block w-full border rounded p-2"
                      value={formState[String(item.id)] || ''}
                      onChange={e => handleChange(String(item.id), e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                );
              }
              // Default to text input
              return (
                <div key={String(item.id)}>
                  <label className="block text-sm font-medium mb-1">{item.label}</label>
                  <input
                    type="text"
                    className="block w-full border rounded p-2"
                    value={formState[String(item.id)] || ''}
                    onChange={e => handleChange(String(item.id), e.target.value)}
                    disabled={submitting}
                  />
                </div>
              );
            })}
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Evaluation'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
