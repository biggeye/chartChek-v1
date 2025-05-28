import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '~/store/chat/chatStore';
import { useHistoryStore } from '~/store/chat/historyStore';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';

interface SessionManagerReturn {
  currentSessionId: string | undefined;
  sessions: any[];
  contextItems: any[];
  ensureSession: () => Promise<string>;
  loadSessions: () => void;
  isCreatingSession: boolean;
}

export function useSessionManager(): SessionManagerReturn {
  const router = useRouter();
  const { id: urlSessionId } = useParams();
  const { currentSessionId, setCurrentSession, createSession, isCreatingSession } = useChatStore();
  const { loadSessions, sessions } = useHistoryStore();
  const { items: contextItems, clearQueue } = useContextQueueStore();

  // Load sessions if not loaded
  useEffect(() => {
    if (sessions.length === 0) {
      loadSessions();
    }
  }, [sessions.length, loadSessions]);

  // Sync URL session with store
  useEffect(() => {
    if (urlSessionId && urlSessionId !== currentSessionId) {
      // First clear existing context
      clearQueue();
      // Set the new session
      setCurrentSession(urlSessionId as string);
      // No longer loading context for the new session from Supabase
    }
  }, [urlSessionId, currentSessionId, setCurrentSession, clearQueue]);

  // Memoize ensureSession to prevent recreation on every render
  const ensureSession = useCallback(async () => {
    try {
      // If we have a URL session ID, verify it exists in our sessions list
      if (urlSessionId) {
        const sessionExists = sessions.some(s => s.id === urlSessionId);
        if (sessionExists) {
          setCurrentSession(urlSessionId as string);
          return urlSessionId as string;
        }
        // If URL session doesn't exist, clear it and create new
        router.replace('/product/chat');
      }
      
      // If we have a current session, verify it exists
      if (currentSessionId) {
        const sessionExists = sessions.some(s => s.id === currentSessionId);
        if (sessionExists) {
          return currentSessionId;
        }
        // If current session doesn't exist, clear it
        setCurrentSession('');
      }

      // Only create a new session if we don't have one and aren't already creating one
      if (!isCreatingSession) {
        const newSessionId = await createSession();
        router.replace(`/product/chat/${newSessionId}`);
        return newSessionId;
      } else {
        throw new Error('Session creation already in progress');
      }
    } catch (error) {
      console.error('Failed to ensure session:', error);
      throw error;
    }
  }, [urlSessionId, currentSessionId, sessions, createSession, router, setCurrentSession, isCreatingSession]);


  return {
    currentSessionId: urlSessionId ? String(urlSessionId) : currentSessionId || undefined,
    sessions,
    contextItems,
    ensureSession,
    loadSessions,
    isCreatingSession
  };
} 