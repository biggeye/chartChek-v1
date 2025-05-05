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
}));