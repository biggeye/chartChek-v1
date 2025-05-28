// Inline types for now; migrate to /types/store/chat.ts if needed
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  promptId?: string;
};

export type ChatPrompt = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  currentPromptId?: string;
};

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '~/utils/supabase/client';
import { useHistoryStore } from './historyStore';

const supabase = createClient();

export interface ChatState {
  currentSessionId: string | null;
  isCreatingSession: boolean;
  currentPromptId: string | null;
  setCurrentSession: (sessionId: string) => void;
  createSession: (title?: string) => Promise<string>;
  clearCurrentSession: () => void;
  setCurrentPrompt: (promptId: string | null) => void;
  createPrompt: (title?: string) => Promise<string>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSessionId: null,
  isCreatingSession: false,
  currentPromptId: null,

  setCurrentSession: (sessionId: string) => {
    if (get().currentSessionId !== sessionId) {
      set({ currentSessionId: sessionId });
    }
  },

  createSession: async (title?: string) => {
    const state = get();
    
    // If we already have a current session, return it
    if (state.currentSessionId) {
      return state.currentSessionId;
    }
    
    // Use a local variable to track if we should proceed with creation
    let shouldCreate = false;
    
    set(state => {
      // Only proceed if we're not already creating and don't have a session
      if (!state.isCreatingSession && !state.currentSessionId) {
        shouldCreate = true;
        return { isCreatingSession: true };
      }
      return state;
    });

    // If we shouldn't create, wait for existing creation to finish
    if (!shouldCreate) {
      // Wait for the existing creation to finish
      let retries = 0;
      while (get().isCreatingSession && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      // After waiting, return whatever session we have
      const finalState = get();
      if (finalState.currentSessionId) {
        return finalState.currentSessionId;
      }
      throw new Error('Session creation timeout');
    }

    try {
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

  setCurrentPrompt: (promptId: string | null) => {
    set({ currentPromptId: promptId });
  },

  createPrompt: async (title?: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const promptId = uuidv4();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('prompts')
        .insert({
          id: promptId,
          account_id: user.id,
          title: title || 'New Prompt',
          created_at: now,
          updated_at: now
        });

      if (error) {
        console.error('Failed to create prompt:', error);
        throw error;
      }

      set({ currentPromptId: promptId });
      return promptId;
    } catch (error) {
      console.error('Error in createPrompt:', error);
      throw error;
    }
  },
}));