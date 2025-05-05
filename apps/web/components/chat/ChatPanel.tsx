import { useUser } from '@kit/supabase/hooks/use-user';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';
import { useChat } from 'ai/react';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '~/utils/supabase/client';
import { Message } from 'ai';

interface ChatPanelProps {
  sessionId: string;
  contextString?: string;
}

interface MessageInputProps {
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { data: user } = useUser();
  const { items: contextItems, getSelectedContent, storeContextInSession } = useContextQueueStore();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<Error | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function verifyAndFetchHistory() {
      if (!user) return;
      
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        // First verify the session exists and belongs to this user
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('id', sessionId)
          .eq('account_id', user.id)
          .single();

        if (sessionError || !session) {
          throw new Error('Session not found or unauthorized');
        }

        setSessionVerified(true);

        // Now fetch the history
        const res = await fetch(`/api/chat/history?sessionId=${sessionId}`);
        if (!res.ok) throw new Error(`Failed to fetch chat history: ${res.statusText}`);
        const data = await res.json();
        setInitialMessages(data.messages || []);
      } catch (err) {
        setHistoryError(err as Error);
        setInitialMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    }
    verifyAndFetchHistory();
  }, [sessionId, user]);

  useEffect(() => {
    if (sessionId && contextItems.length > 0) {
      console.log('[ChatPanel] Context items changed, storing in session:', {
        sessionId,
        itemCount: contextItems.length,
        selectedCount: contextItems.filter(item => item.selected).length
      });
      
      storeContextInSession(sessionId).catch(error => {
        console.error('[ChatPanel] Failed to store context:', error);
      });
    }
  }, [sessionId, contextItems, storeContextInSession]);

  const handleResponse = useCallback(async (response: Response) => {
    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Chat API error: ${response.statusText}`);
    }
  }, []);

  const handleFinish = useCallback(async (message: Message) => {
    console.log('Message stream finished:', message);
    try {
      const res = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          messages: [message]
        })
      });
      if (!res.ok) {
        throw new Error(`Failed to save message: ${res.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [sessionId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    isLoading
  } = useChat({
    api: '/api/chat',
    body: {
      sessionId,
      context: getSelectedContent(),
    },
    id: sessionId,
    initialMessages,
    onResponse: async (response) => {
      if (!response.ok) {
        console.error(`[ChatPanel] HTTP ${response.status}: ${response.statusText}`);
        throw new Error(`Chat API error: ${response.statusText}`);
      }
      // Log the context that was sent
      console.log('[ChatPanel] Chat request sent with context:', {
        contextLength: getSelectedContent()?.length || 0,
        sessionId
      });
    },
    onFinish: handleFinish,
    onError: (error) => {
      console.error('[ChatPanel] Chat error:', error);
    },
    headers: {
      'Content-Type': 'application/json',
    }
  });

  useEffect(() => {
    const currentContext = getSelectedContent();
    console.log('[ChatPanel] Current context:', currentContext);
  }, [getSelectedContent]);

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Please sign in to use the chat.</div>
      </div>
    );
  }

  if (loadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-muted-foreground">Loading chat history...</div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Error loading history: {historyError.message}</div>
      </div>
    );
  }

  if (!sessionVerified) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Invalid or unauthorized session.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <MessageList messages={messages} isLoading={isLoading} />
      <div className="fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out left-4 lg:left-24 right-4 xl:right-[calc(24rem+1rem)]">
        <MessageInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
} 