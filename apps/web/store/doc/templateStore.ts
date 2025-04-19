// store/templateStore.ts
import { create } from 'zustand';
import { ChartChekTemplate } from 'types/store/doc/templates';
import { KipuEvaluation, KipuEvaluationItemObject } from 'types/kipu/kipuAdapter';

interface TemplateState {
  templates: ChartChekTemplate[];
  selectedTemplate: ChartChekTemplate | null;
  isLoadingTemplates: boolean;

  kipuTemplates: KipuEvaluation[];
  selectedKipuTemplate: KipuEvaluation | null;
  isLoadingKipuTemplates: boolean;

  error: string | null;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchTemplate: (id: string) => Promise<void>;
  setSelectedTemplate: (template: ChartChekTemplate | null) => void;
  createTemplate: (template: ChartChekTemplate) => Promise<void>;
  saveTemplate: (template: ChartChekTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  fetchKipuTemplates: () => Promise<void>;
  fetchKipuTemplate: (evaluationId: number) => Promise<void>;
  setSelectedKipuTemplate: (kipuTemplate: KipuEvaluation | null) => void;
  importKipuTemplate: (kipuTemplate: KipuEvaluation) => Promise<ChartChekTemplate>;

}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  isLoadingTemplates: false,

  kipuTemplates: [],
  selectedKipuTemplate: null,
  isLoadingKipuTemplates: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoadingTemplates: true, error: null });
    try {
      const response = await fetch('/api/admin/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const templates = await response.json();
      set({ templates, isLoadingTemplates: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingTemplates: false });
    }
  },
  
  fetchTemplate: async (id: string) => {
    set({ isLoadingTemplates: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      const template = await response.json();
      set({ selectedTemplate: template, isLoadingTemplates: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingTemplates: false });
    }
  },

  setSelectedTemplate: (template: ChartChekTemplate | null) => {
    set({ selectedTemplate: template || null });
  },


  createTemplate: async (template: ChartChekTemplate) => {
    set({ isLoadingTemplates: true, error: null });
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to create template');
      const newTemplate = await response.json();
      set(state => ({
        templates: [...state.templates, newTemplate],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoadingTemplates: false });
    }
  },
  saveTemplate: async (template: ChartChekTemplate) => {
    set({ isLoadingTemplates: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to update template');
      const updatedTemplate = await response.json();
      set(state => ({
        templates: state.templates.map(t =>
          t.id === updatedTemplate.id ? updatedTemplate : t
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoadingTemplates: false });
    }
  },
  deleteTemplate: async (id: string) => {
    set({ isLoadingTemplates: true, error: null });
    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete template');
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoadingTemplates: false });
    }
  },
clearSelectedTemplate: () => set({ selectedTemplate: null}),

  // Kipu Evaluation Templates actions
  fetchKipuTemplates: async () => {
    set({ isLoadingKipuTemplates: true, error: null });
    try {
      const response = await fetch('/api/kipu/evaluations');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
        console.log('KIPU Template Store: ', data);
      if (data.success && data.data && data.data.evaluations) {
        set({ kipuTemplates: data.data.evaluations });
        console.log('KIPU Template Store:  KIPU templates set: data', data.data.evaluations);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch evaluation templates: ${errorMessage}` });
      console.error('Error fetching evaluation templates:', error);
    } finally {
      set({ isLoadingKipuTemplates: false });
    }
  },

  setSelectedKipuTemplate: (kipuTemplate?: KipuEvaluation | null) => {
    set({ selectedKipuTemplate: kipuTemplate });
  },
  fetchKipuTemplate: async (evaluationId: number) => {
    set({ isLoadingKipuTemplates: true, error: null });
    console.log('KIPU Template Store] template ID (evaluationId): ', evaluationId);
    try {
      const response = await fetch(`/api/kipu/evaluations/${evaluationId}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();

      if (data) {
        set({ selectedKipuTemplate: data.evaluation });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: `Failed to fetch evaluation template: ${errorMessage}` });
      console.error('Error fetching evaluation template:', error);
    } finally {
      set({ isLoadingKipuTemplates: false });
    }
  },
  importKipuTemplate: async (kipuTemplate: KipuEvaluation) => {
    set({ isLoadingKipuTemplates: true, error: null });
    set({ isLoadingTemplates: true, error: null });
    try {

      const { adaptKipuEvaluationToTemplate } = await import('~/lib/kipu/mapping/kipuEvaluationAdapter');
      const convertedTemplate = await adaptKipuEvaluationToTemplate(kipuTemplate);

      // Update state with the new template
      set(state => ({
        ...state,
        currentTemplate: convertedTemplate,
        isLoadingTemplates: false,
        isLoadingKipuTemplates: false
      }));

      return convertedTemplate;
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingTemplates: false,
        isLoadingKipuTemplates: false
      });
      throw error;
    }
  },

  clearSelectedKipuTemplate: () => set({ selectedKipuTemplate: null }),




}));

export default useTemplateStore;