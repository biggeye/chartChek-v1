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
  generateSessionTitle: (sessionId: string, messages: ChatMessage[]) => Promise<void>;
  cleanupEmptySessions: () => Promise<void>;
}

// AI-powered title generation
const generateTitleFromMessages = async (messages: ChatMessage[]): Promise<string> => {
  if (messages.length === 0) return 'New Chat';
  
  // Use the first user message for context
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  try {
    const response = await fetch('/api/chat/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.slice(0, 3) // Send first few messages for context
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.title || firstUserMessage.content.slice(0, 50);
    }
  } catch (error) {
    console.error('Failed to generate AI title:', error);
  }
  
  // Fallback to truncated first user message
  return firstUserMessage.content.slice(0, 50);
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get all sessions with their messages - try to get metadata but don't fail if column doesn't exist
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

          const messageList = messages?.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            createdAt: msg.created_at
          })) || [];

          // Try to get title from metadata (if column exists), otherwise generate from messages
          let title = 'New Chat';
          if (messageList.length > 0) {
            title = await generateTitleFromMessages(messageList);
          }

          return {
            id: session.id,
            title,
            messages: messageList,
            createdAt: session.created_at,
            updatedAt: session.updated_at
          } as ChatSession;
        })
      );

      // Filter out sessions that are empty and older than 1 hour
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const validSessions = sessionsWithMessages.filter(session => {
        if (session.messages.length === 0) {
          const createdAt = new Date(session.createdAt);
          if (createdAt < oneHourAgo) {
            // Delete empty old sessions in the background
            get().deleteSession(session.id).catch(console.error);
            return false;
          }
        }
        return true;
      });

      set({ sessions: validSessions, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  generateSessionTitle: async (sessionId: string, messages: ChatMessage[]) => {
    try {
      const title = await generateTitleFromMessages(messages);
      
      // Try to update metadata, but don't fail if column doesn't exist
      try {
        await supabase
          .from('chat_sessions')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      } catch (dbError) {
        console.warn('Could not update session metadata (column may not exist):', dbError);
      }

      // Update local state
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, title } : s
        )
      }));
    } catch (error) {
      console.error('Failed to generate session title:', error);
    }
  },

  cleanupEmptySessions: async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get all sessions older than 1 hour
      const { data: oldSessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .lt('created_at', oneHourAgo.toISOString());

      if (sessionsError) throw sessionsError;

      // Check which ones have no messages
      const emptySessionIds: string[] = [];
      for (const session of oldSessions || []) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .eq('session_id', session.id);
        
        if (count === 0) {
          emptySessionIds.push(session.id);
        }
      }

      // Delete empty sessions
      if (emptySessionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('chat_sessions')
          .delete()
          .in('id', emptySessionIds);

        if (deleteError) throw deleteError;

        // Update local state
        set(state => ({
          sessions: state.sessions.filter(s => !emptySessionIds.includes(s.id))
        }));

        console.log(`Cleaned up ${emptySessionIds.length} empty sessions`);
      }
    } catch (error) {
      console.error('Failed to cleanup empty sessions:', error);
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
      console.log('[createSession] Starting session creation');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[createSession] Auth result:', { user, authError });
      
      if (authError || !user) {
        console.error('[createSession] Authentication required', { authError, user });
        throw new Error('Authentication required');
      }

      const sessionId = uuidv4();
      const now = new Date().toISOString();

      console.log('[createSession] Inserting session:', { sessionId, userId: user.id, now });
      // Create a new session without metadata (for compatibility with older schema)
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          account_id: user.id,
          created_at: now,
          updated_at: now
        });

      console.log('[createSession] Insert result:', { sessionError });
      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        throw sessionError;
      }

      console.log('[createSession] Verifying session creation:', { sessionId });
      // Verify the session was created by fetching it
      const { data: createdSession, error: verifyError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      console.log('[createSession] Verification result:', { createdSession, verifyError });
      if (verifyError || !createdSession) {
        console.error('Failed to verify session creation:', verifyError);
        throw new Error('Session creation could not be verified');
      }

      console.log('[createSession] Session created and verified, updating local state');
      // Update local state only after successful verification
      set(state => ({
        sessions: [{
          id: sessionId,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now
        }, ...state.sessions]
      }));

      console.log('[createSession] Returning sessionId:', sessionId);
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