// store/templateStore.ts
import { create } from 'zustand';
import { ChartChekTemplate } from 'types/store/doc/templates';
import { KipuEvaluation, KipuEvaluationItemObject } from 'types/kipu/kipuAdapter';

interface TemplateState {

  kipuTemplates: KipuEvaluation[];
  selectedKipuTemplate: KipuEvaluation | null;
  isLoadingKipuTemplates: boolean;

  error: string | null;

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

  // Kipu Evaluation Templates actions
  fetchKipuTemplates: async () => {
    set({ isLoadingKipuTemplates: true, error: null });
    try {
      const response = await fetch('/api/kipu/evaluations');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.evaluations)) {
        const sorted = [...data.data.evaluations].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        set({ kipuTemplates: sorted });
      } else {
        throw new Error('Unexpected response format from KIPU API');
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
        isLoadingKipuTemplates: false
      });
      throw error;
    }
  },

  clearSelectedKipuTemplate: () => set({ selectedKipuTemplate: null }),




}));

export default useTemplateStore;