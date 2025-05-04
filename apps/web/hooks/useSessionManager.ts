import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '~/store/chat/chatStore';
import { useHistoryStore } from '~/store/chat/historyStore';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';

interface SessionManagerReturn {
  currentSessionId: string | undefined;
  sessions: any[];
  contextItems: any[];
  contextString: string | undefined;
  ensureSession: () => Promise<string>;
  loadSessions: () => void;
  isCreatingSession: boolean;
}

export function useSessionManager(): SessionManagerReturn {
  const router = useRouter();
  const { id: urlSessionId } = useParams();
  const { currentSessionId, setCurrentSession, createSession, isCreatingSession } = useChatStore();
  const { loadSessions, sessions } = useHistoryStore();
  const { items: contextItems, getSelectedContent } = useContextQueueStore();

  // Sync URL session with store
  useEffect(() => {
    if (urlSessionId && urlSessionId !== currentSessionId) {
      setCurrentSession(urlSessionId as string);
    }
  }, [urlSessionId, currentSessionId, setCurrentSession]);

  // Load sessions if not loaded
  useEffect(() => {
    if (sessions.length === 0) {
      loadSessions();
    }
  }, [sessions.length, loadSessions]);

  // Memoize ensureSession to prevent recreation on every render
  const ensureSession = useCallback(async () => {
    try {
      // If we have a URL session ID, use that
      if (urlSessionId) {
        setCurrentSession(urlSessionId as string);
        return urlSessionId as string;
      }
      
      // If we have a current session, use that
      if (currentSessionId) {
        return currentSessionId;
      }

      // Only create a new session if we don't have one and aren't already creating one
      if (!isCreatingSession) {
        const newSessionId = await createSession();
        router.push(`/product/chat/${newSessionId}`);
        return newSessionId;
      } else {
        throw new Error('Session creation already in progress');
      }
    } catch (error) {
      console.error('Failed to ensure session:', error);
      throw error;
    }
  }, [urlSessionId, currentSessionId, createSession, router, setCurrentSession, isCreatingSession]);

  // Get the context string from the selected items
  const contextString = getSelectedContent();

  return {
    currentSessionId: urlSessionId ? String(urlSessionId) : currentSessionId || undefined,
    sessions,
    contextItems,
    contextString,
    ensureSession,
    loadSessions,
    isCreatingSession
  };
} 