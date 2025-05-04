// Inline types for now; migrate to /types/store/chat.ts if needed
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '~/utils/supabase/client';
import { useHistoryStore } from './historyStore';

const supabase = createClient();

export interface ChatState {
  currentSessionId: string | null;
  isCreatingSession: boolean;
  setCurrentSession: (sessionId: string) => void;
  createSession: (title?: string) => Promise<string>;
  clearCurrentSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSessionId: null,
  isCreatingSession: false,

  setCurrentSession: (sessionId: string) => {
    if (get().currentSessionId !== sessionId) {
      set({ currentSessionId: sessionId });
    }
  },

  createSession: async (title?: string) => {
    const state = get();
    
    // If we're already creating a session or have a current session, don't create another
    if (state.isCreatingSession) {
      throw new Error('Session creation already in progress');
    }
    
    if (state.currentSessionId) {
      return state.currentSessionId;
    }

    try {
      set({ isCreatingSession: true });
      const historyStore = useHistoryStore.getState();
      const sessionId = await historyStore.createSession(title);
      set({ currentSessionId: sessionId, isCreatingSession: false });
      return sessionId;
    } catch (error) {
      set({ isCreatingSession: false });
      throw error;
    }
  },

  clearCurrentSession: () => {
    set({ currentSessionId: null, isCreatingSession: false });
  },
}));