// store/compliance/specialistStore.ts
import { create } from 'zustand';
import { ComplianceSpecialist } from '~/components/compliance/specialist-selector';

interface SpecialistState {
  specialists: ComplianceSpecialist[];
  selectedSpecialist: ComplianceSpecialist | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSpecialists: () => Promise<void>;
  selectSpecialist: (specialist: ComplianceSpecialist) => void;
  querySpecialist: (query: string) => Promise<{ answer: string; sources: any[] }>;
}

// Default specialists as fallback
const DEFAULT_SPECIALISTS: ComplianceSpecialist[] = [
  {
    id: 'joint-commission',
    name: 'Joint Commission',
    description: 'Specializes in healthcare accreditation standards and patient safety guidelines',
    corpusName: 'joint_commission_corpus'
  },
  {
    id: 'dhcs',
    name: 'DHCS',
    description: 'Department of Health Care Services compliance specialist for California regulations',
    corpusName: 'dhcs_corpus'
  }
];

export const useSpecialistStore = create<SpecialistState>((set, get) => ({
  specialists: DEFAULT_SPECIALISTS,
  selectedSpecialist: DEFAULT_SPECIALISTS[0],
  isLoading: false,
  error: null,
  
  fetchSpecialists: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/gemini/corpus');
      if (!response.ok) {
        throw new Error('Failed to fetch compliance specialists');
      }
      
      const data = await response.json();
      
      if (data.corpora && Array.isArray(data.corpora)) {
        // Map corpora to specialists
        const fetchedSpecialists = data.corpora.map((corpus: any) => ({
          id: corpus.name.split('/').pop() || corpus.name,
          name: corpus.displayName || corpus.name,
          description: corpus.description || 'Compliance specialist',
          corpusName: corpus.name
        }));
        
        if (fetchedSpecialists.length > 0) {
          set({ 
            specialists: fetchedSpecialists,
            // Keep the currently selected specialist if it exists in the new list
            selectedSpecialist: get().selectedSpecialist 
              ? fetchedSpecialists.find((s: any) => s.id === get().selectedSpecialist?.id) || fetchedSpecialists[0]
              : fetchedSpecialists[0]
          });
        } else {
          // Fall back to defaults if no specialists were found
          set({ specialists: DEFAULT_SPECIALISTS, selectedSpecialist: DEFAULT_SPECIALISTS[0] });
        }
      }
    } catch (error) {
      console.error('Error fetching specialists:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load compliance specialists',
        specialists: DEFAULT_SPECIALISTS,
        selectedSpecialist: DEFAULT_SPECIALISTS[0]
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  selectSpecialist: (specialist) => {
    set({ selectedSpecialist: specialist });
    // Store the selection in localStorage for persistence
    localStorage.setItem('selectedSpecialist', JSON.stringify(specialist));
  },
  
  querySpecialist: async (query) => {
    const { selectedSpecialist } = get();
    
    if (!selectedSpecialist) {
      throw new Error('No compliance specialist selected');
    }
    
    try {
      const response = await fetch(`/api/gemini/corpus/corpora/${selectedSpecialist.corpusName}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to query compliance specialist');
      }
      
      const data = await response.json();
      return {
        answer: data.answer || 'No answer found',
        sources: data.relevantChunks || []
      };
    } catch (error) {
      console.error('Error querying specialist:', error);
      throw error;
    }
  }
}));

// Initialize by loading from localStorage if available
if (typeof window !== 'undefined') {
  const savedSpecialist = localStorage.getItem('selectedSpecialist');
  if (savedSpecialist) {
    try {
      const specialist = JSON.parse(savedSpecialist);
      useSpecialistStore.getState().selectSpecialist(specialist);
    } catch (e) {
      console.error('Error loading saved specialist:', e);
    }
  }
}
