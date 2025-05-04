import { create } from 'zustand';
import { createClient } from '~/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, ChatMessage } from './chatStore';

const supabase = createClient();

interface HistoryState {
  sessions: ChatSession[];
  isLoading: boolean;
  error: Error | null;
  // Actions
  loadSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get all sessions with their messages
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // For each session, get its messages
      const sessionsWithMessages = await Promise.all(
        sessionsData.map(async (session) => {
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('id, role, content, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          return {
            id: session.id,
            title: messages?.[0]?.content?.slice(0, 50) || 'New Chat',
            messages: messages?.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              createdAt: msg.created_at
            })) || [],
            createdAt: session.created_at,
            updatedAt: session.updated_at
          } as ChatSession;
        })
      );

      set({ sessions: sessionsWithMessages, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== sessionId)
      }));
    } catch (error) {
      set({ error: error as Error });
      throw error;
    }
  },

  createSession: async (title = 'New Chat') => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const sessionId = uuidv4();
      const now = new Date().toISOString();

      // Create a new session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          account_id: user.id,
        });

      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        throw sessionError;
      }

      // Update local state
      set(state => ({
        sessions: [{
          id: sessionId,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now
        }, ...state.sessions]
      }));

      return sessionId;
    } catch (error) {
      console.error('Error in createSession:', error);
      set({ error: error as Error });
      throw error;
    }
  },

  updateSession: async (sessionId: string, updates: Partial<ChatSession>) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
          ...updates
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, ...updates } : s
        )
      }));
    } catch (error) {
      set({ error: error as Error });
      throw error;
    }
  }
})); 