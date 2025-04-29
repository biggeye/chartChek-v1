import { create } from 'zustand';
import { ComplianceProtocol, ProtocolRequirement, RequirementType } from '~/types/evaluation';
import { createClient } from '~/utils/supabase/client';

interface ProtocolForm {
  admission: number[];
  daily: number[];
  cyclic: number[];
  cycleLength: number;
}

interface ProtocolState {
  protocols: ComplianceProtocol[];
  form: ProtocolForm | null;
  selectedProtocolId: string | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  showSaveModal: boolean;
  protocolName: string;
  protocolDescription: string;
  // Protocol List Actions
  fetchProtocols: () => Promise<void>;
  setProtocols: (protocols: ComplianceProtocol[]) => void;
  addProtocol: (protocol: ComplianceProtocol) => void;
  updateProtocol: (id: string, protocol: Partial<ComplianceProtocol>) => void;
  deleteProtocol: (id: string) => void;
  // Protocol Selection Actions
  selectProtocol: (protocolId: string | null) => void;
  loadSelectedProtocol: () => void;
  // Form Management
  setForm: (form: ProtocolForm | null) => void;
  updateFormField: <K extends keyof ProtocolForm>(field: K, value: ProtocolForm[K]) => void;
  resetForm: () => void;
  // Modal Management
  setShowSaveModal: (show: boolean) => void;
  setProtocolName: (name: string) => void;
  setProtocolDescription: (description: string) => void;
  // Status Management
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setLoading: (loading: boolean) => void;
  // Save Protocol
  saveProtocol: () => Promise<void>;
}

const DEFAULT_FORM: ProtocolForm = {
  admission: [],
  daily: [],
  cyclic: [],
  cycleLength: 7
};

const initialState = {
  protocols: [] as ComplianceProtocol[],
  form: null as ProtocolForm | null,
  selectedProtocolId: null,
  isLoading: false,
  error: null,
  success: false,
  showSaveModal: false,
  protocolName: '',
  protocolDescription: ''
};

export const useProtocolStore = create<ProtocolState>((set, get) => ({
  ...initialState,

  fetchProtocols: async () => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      // Fetch protocols and join requirements
      const { data, error } = await supabase
        .from('compliance_protocols')
        .select('*, requirements:compliance_protocol_requirements(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ protocols: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      set({
        error: 'Failed to fetch protocols',
        isLoading: false,
        protocols: []
      });
    }
  },

  setProtocols: (protocols) => set({ protocols }),
  addProtocol: (protocol) => set((state) => ({ protocols: [protocol, ...state.protocols] })),
  updateProtocol: (id, protocol) => set((state) => ({
    protocols: state.protocols.map(p => p.id === id ? { ...p, ...protocol } : p)
  })),
  deleteProtocol: (id) => set((state) => ({
    protocols: state.protocols.filter(p => p.id !== id)
  })),

  selectProtocol: (protocolId) => set({ selectedProtocolId: protocolId }),
  loadSelectedProtocol: () => {
    const state = get();
    const protocol = state.protocols.find(p => p.id === state.selectedProtocolId);
    if (protocol && protocol.requirements) {
      // Group requirements by type
      const admission = protocol.requirements.filter(r => r.requirement === 'admission').map(r => r.evaluation_id);
      const daily = protocol.requirements.filter(r => r.requirement === 'daily').map(r => r.evaluation_id);
      const cyclic = protocol.requirements.filter(r => r.requirement === 'cyclic').map(r => r.evaluation_id);
      set({
        form: {
          admission,
          daily,
          cyclic,
          cycleLength: protocol.cycleLength || 7
        },
        protocolName: protocol.name,
        protocolDescription: protocol.description || ''
      });
    } else {
      set({ form: DEFAULT_FORM, protocolName: '', protocolDescription: '' });
    }
  },

  setForm: (form) => set({ form }),
  updateFormField: (field, value) => set((state) => ({
    form: state.form ? { ...state.form, [field]: value } : null
  })),
  resetForm: () => set({ form: DEFAULT_FORM, protocolName: '', protocolDescription: '' }),

  setShowSaveModal: (show) => set({ showSaveModal: show }),
  setProtocolName: (name) => set({ protocolName: name }),
  setProtocolDescription: (description) => set({ protocolDescription: description }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setLoading: (loading) => set({ isLoading: loading }),

  saveProtocol: async () => {
    const state = get();
    if (!state.form) return;
    const requirements: { evaluation_id: number; requirement: RequirementType }[] = [
      ...state.form.admission.map((evaluation_id) => ({ evaluation_id, requirement: 'admission' as RequirementType })),
      ...state.form.daily.map((evaluation_id) => ({ evaluation_id, requirement: 'daily' as RequirementType })),
      ...state.form.cyclic.map((evaluation_id) => ({ evaluation_id, requirement: 'cyclic' as RequirementType })),
    ];
    const supabase = createClient();
    set({ isLoading: true, error: null });
    try {
      let result;
      if (state.selectedProtocolId) {
        // Update protocol via RPC
        result = await supabase.rpc('update_compliance_protocol', {
          protocol_id: state.selectedProtocolId,
          name: state.protocolName,
          description: state.protocolDescription,
          cycle_length: state.form.cycleLength,
          requirements: requirements,
        });
      } else {
        // Insert protocol via RPC
        result = await supabase.rpc('insert_compliance_protocol', {
          name: state.protocolName,
          description: state.protocolDescription,
          cycle_length: state.form.cycleLength,
          requirements: requirements,
        });
      }
      const { error } = result;
      if (error) throw error;
      set({ success: true, isLoading: false });
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error saving protocol:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to save protocol', isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  }
}));