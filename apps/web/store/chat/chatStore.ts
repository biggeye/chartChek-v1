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

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string;
  isProcessing: boolean;
  currentResponse: string | null;
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  getCurrentSession: () => ChatSession;
  addMessageToSession: (message: ChatMessage) => void;
  handleSendMessage: (userMessage: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => {
  const initialId = uuidv4();
  const initialSession: ChatSession = {
    id: initialId,
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    sessions: [initialSession],
    currentSessionId: initialId,
    isProcessing: false,
    currentResponse: null,

    createSession: (title = 'New Chat') => {
      const newSession: ChatSession = {
        id,
        title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSessionId: id,
      }));
      return id;
    },

    deleteSession: (sessionId) => {
      set((state) => {
        const sessions = state.sessions.filter((s) => s.id !== sessionId);
        const newCurrentId =
          state.currentSessionId === sessionId && sessions.length > 0
            ? sessions[0].id
            : state.currentSessionId === sessionId
            ? null
            : state.currentSessionId;
        return { sessions, currentSessionId: newCurrentId! };
      });
    },

    setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

    getCurrentSession: () => {
      const { sessions, currentSessionId } = get();
      const found = sessions.find((s) => s.id === currentSessionId);
      return found ?? sessions[0]!;
    },

    addMessageToSession: (message) => {
      set((state) => {
        const idx = state.sessions.findIndex((s) => s.id === state.currentSessionId);
        if (idx < 0) return {};
        const session = state.sessions[idx];
        const updatedSession = {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date().toISOString(),
        };
        const sessions = [...state.sessions];
        sessions[idx] = updatedSession;
        return { sessions };
      });
    },

    handleSendMessage: async (userMessage: string) => {
      const session = get().getCurrentSession();
      set({ isProcessing: true, currentResponse: null });
      // Add user message
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      get().addMessageToSession(userMsg);

      try {
        const payload = { messages: session.messages.concat(userMsg) };
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.body) throw new Error('No response body');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          set({ currentResponse: fullText });
        }
        // Add assistant message
        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        get().addMessageToSession(assistantMsg);
        set({ currentResponse: null });
      } catch (err) {
        set({ currentResponse: '[Error receiving response]' });
      } finally {
        set({ isProcessing: false });
      }
    },
  };
});