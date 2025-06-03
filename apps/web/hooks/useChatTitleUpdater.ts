import { useEffect, useCallback } from 'react';
import { useHistoryStore } from '~/store/chat/historyStore';

interface UseChatTitleUpdaterProps {
  sessionId: string;
  messages: any[];
  enabled?: boolean;
}

export function useChatTitleUpdater({ sessionId, messages, enabled = true }: UseChatTitleUpdaterProps) {
  const { generateSessionTitle } = useHistoryStore();

  const updateTitle = useCallback(async () => {
    if (!enabled || !sessionId || messages.length === 0) return;

    // Only generate title if we have at least 2 messages (user + assistant)
    if (messages.length >= 2) {
      const hasUserMessage = messages.some(msg => msg.role === 'user');
      const hasAssistantMessage = messages.some(msg => msg.role === 'assistant');
      
      if (hasUserMessage && hasAssistantMessage) {
        try {
          await generateSessionTitle(sessionId, messages);
        } catch (error) {
          console.error('Failed to update session title:', error);
        }
      }
    }
  }, [sessionId, messages, enabled, generateSessionTitle]);

  // Trigger title generation when messages change
  useEffect(() => {
    updateTitle();
  }, [updateTitle]);

  return { updateTitle };
} 