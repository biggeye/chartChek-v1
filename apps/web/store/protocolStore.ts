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
  fetchProtocols: () => Promise<void>;
  setProtocols: (protocols: ComplianceProtocol[]) => void;
  addProtocol: (protocol: ComplianceProtocol) => void;
  updateProtocol: (id: string, payload: any) => Promise<void>;
  deleteProtocol: (id: string) => Promise<void>;
  selectProtocol: (protocolId: string | null) => void;
  loadSelectedProtocol: () => void;
  setForm: (form: ProtocolForm | null) => void;
  updateFormField: <K extends keyof ProtocolForm>(field: K, value: ProtocolForm[K]) => void;
  resetForm: () => void;
  setShowSaveModal: (show: boolean) => void;
  setProtocolName: (name: string) => void;
  setProtocolDescription: (description: string) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setLoading: (loading: boolean) => void;
  saveProtocol: () => Promise<void>;
  fetchProtocolById: (id: string) => Promise<any>;
  fetchRequirementsForProtocol: (protocolId: string) => Promise<ProtocolRequirement[]>;
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
      const res = await fetch('/api/compliance/protocols');
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch protocols');
      set({ protocols: result.data || [], isLoading: false });
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
  updateProtocol: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/compliance/protocols/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update protocol');
      set({ success: true, isLoading: false, error: null });
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error updating protocol:', error);
      set({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while updating the protocol',
        isLoading: false,
        success: false
      });
    }
  },
  deleteProtocol: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/compliance/protocols/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete protocol');
      set({ success: true, isLoading: false, error: null });
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error deleting protocol:', error);
      set({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the protocol',
        isLoading: false,
        success: false
      });
    }
  },

  selectProtocol: (protocolId) => set({ selectedProtocolId: protocolId }),
  loadSelectedProtocol: async () => {
    const state = get();
    const protocol = state.protocols.find(p => p.id === state.selectedProtocolId);
    if (protocol) {
      // Always fetch requirements fresh for the selected protocol
      const requirements = await get().fetchRequirementsForProtocol(protocol.id);
      // Group requirements by type
      const admission = requirements.filter(r => r.requirement === 'admission').map(r => r.evaluation_id);
      const daily = requirements.filter(r => r.requirement === 'daily').map(r => r.evaluation_id);
      const cyclic = requirements.filter(r => r.requirement === 'cyclic').map(r => r.evaluation_id);
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
    if (!state.protocolName?.trim()) {
      set({ error: 'Protocol name is required', isLoading: false });
      return;
    }
    set({ isLoading: true, error: null, success: false });
    try {
      // Step 1: Create protocol (metadata only)
      const protocolPayload = {
        name: state.protocolName,
        description: state.protocolDescription,
        cycleLength: state.form.cycleLength
      };
      const res = await fetch('/api/compliance/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolPayload)
      });
      const result = await res.json();
      if (!result.success || !result.data?.id) throw new Error(result.error || 'Failed to create protocol');
      const protocolId = result.data.id;

      // Step 2: Add requirements (admission, daily, cyclic)
      const requirements = [
        ...state.form.admission.map((evaluationId) => ({ evaluationId, requirement: 'admission' })),
        ...state.form.daily.map((evaluationId) => ({ evaluationId, requirement: 'daily' })),
        ...state.form.cyclic.map((evaluationId) => ({ evaluationId, requirement: 'cyclic' }))
      ];
      if (requirements.length > 0) {
        const reqRes = await fetch(`/api/compliance/protocols/${protocolId}/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements })
        });
        const reqResult = await reqRes.json();
        if (!reqResult.success) throw new Error(reqResult.error || 'Failed to add requirements');
      }

      set({ success: true, isLoading: false, error: null });
      await get().fetchProtocols();
    } catch (error) {
      console.error('Error saving protocol:', error);
      set({
        error: error instanceof Error ? error.message : 'An unexpected error occurred while saving the protocol',
        isLoading: false,
        success: false
      });
    }
  },

  fetchProtocolById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/compliance/protocols/${id}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch protocol');
      // Optionally, you can set a single protocol in state or return it
      return result.data;
    } catch (error) {
      console.error('Error fetching protocol:', error);
      set({ error: 'Failed to fetch protocol', isLoading: false });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Fetch requirements for a given protocol ID from the API.
   * Returns an array of ProtocolRequirement objects.
   */
  fetchRequirementsForProtocol: async (protocolId: string): Promise<ProtocolRequirement[]> => {
    if (!protocolId) return [];
    try {
      const res = await fetch(`/api/compliance/protocols/${protocolId}/requirements`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch requirements');
      return result.data || [];
    } catch (error) {
      console.error('Error fetching requirements for protocol:', error);
      return [];
    }
  }
}));

// Custom hook for reading a single protocol by id
import { useEffect, useState } from 'react';

export function useProtocol(protocolId: string | null) {
  const [protocol, setProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!protocolId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/compliance/protocols/${protocolId}`)
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Failed to fetch protocol');
        setProtocol(result.data);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch protocol');
        setProtocol(null);
      })
      .finally(() => setLoading(false));
  }, [protocolId]);

  return { protocol, loading, error };
}