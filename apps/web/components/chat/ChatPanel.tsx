import { useUser } from '@kit/supabase/hooks/use-user';
import { usePatientContextActions } from '~/hooks/usePatientContextActions';
import { useChat } from '@ai-sdk/react';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '~/utils/supabase/client';
import { Message } from 'ai';
import { Loader } from '../loading';
import { toast } from 'sonner';
import { ContextQueue } from './context-queue';
import { useChatTitleUpdater } from '~/hooks/useChatTitleUpdater';

interface ChatPanelProps {
  sessionId: string;
  contextString?: string;
}

function Status({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="text-destructive">{message}</div>
    </div>
  );
}

// Helper function to save messages to database
const saveMessagesToDatabase = async (sessionId: string, messages: Message[]) => {
  try {
    const res = await fetch('/api/chat/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        messages
      })
    });
    if (!res.ok) throw new Error(`Failed to save messages: ${res.statusText}`);
  } catch (error) {
    console.error('Failed to save messages:', error);
    toast.error('Could not save chat messages.');
    throw error;
  }
};

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { data: user } = useUser();
  const { getSelectedContent } = usePatientContextActions();
  const supabase = createClient();
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load historical messages when sessionId changes
  useEffect(() => {
    const loadHistoricalMessages = async () => {
      if (!sessionId || !user) return;
      
      setIsLoadingHistory(true);
      setHistoryLoaded(false);
      
      try {
        console.log('[ChatPanel] Loading historical messages for session:', sessionId);
        
        const response = await fetch(`/api/chat/history?sessionId=${sessionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Session not found or no messages - this is fine for new sessions
            console.log('[ChatPanel] No historical messages found for session:', sessionId);
            setHistoricalMessages([]);
          } else {
            throw new Error(`Failed to load messages: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          const messages = data.messages || [];
          
          // Convert database messages to AI SDK format
          const formattedMessages: Message[] = messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.created_at)
          }));
          
          console.log('[ChatPanel] Loaded historical messages:', formattedMessages.length);
          setHistoricalMessages(formattedMessages);
        }
      } catch (error) {
        console.error('[ChatPanel] Error loading historical messages:', error);
        toast.error('Failed to load chat history');
        setHistoricalMessages([]);
      } finally {
        setIsLoadingHistory(false);
        setHistoryLoaded(true);
      }
    };

    // Reset state and load messages when sessionId changes
    setHistoricalMessages([]);
    loadHistoricalMessages();
  }, [sessionId, user?.id]); // Only depend on sessionId and user.id

  const verifySession = async (sessionId: string, userId: string) => {
    return supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', userId)
      .single();
  };

  // Save assistant messages when they finish
  const handleFinish = useCallback(async (message: Message) => {
    console.log('[ChatPanel] Assistant message finished:', message);
    await saveMessagesToDatabase(sessionId, [message]);
  }, [sessionId]);

  // Save user messages when submitted
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>, input: string) => {
    event.preventDefault();
    
    if (!input.trim()) return;
    
    console.log('[ChatPanel] User message submitted:', input);
    
    // Create user message object
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    // Save user message immediately
    try {
      await saveMessagesToDatabase(sessionId, [userMessage]);
    } catch (error) {
      // Don't prevent submission if save fails, just log it
      console.error('Failed to save user message, but continuing with submission');
    }
    
    // Continue with normal submission
    return input;
  }, [sessionId]);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    status: chatStatus,
    error: chatError,
    isLoading
  } = useChat({
    api: '/api/chat',
    id: sessionId,
    initialMessages: historicalMessages,
    body: {
      sessionId: sessionId,
      context: getSelectedContent()
    },
    onFinish: handleFinish,
    onError: (error) => {
      // TEMP: Log full error details
      console.error('[ChatPanel] onError called. Chat error:', error);
      if (error instanceof Error && error.stack) {
        console.error('[ChatPanel] Error stack:', error.stack);
      }
      if (typeof error === 'object' && error !== null && 'response' in error && error.response) {
        (error.response as Response).text().then((text: string) => {
          console.error('[ChatPanel] Error response body:', text);
        });
      }
      toast.error(`Chat error: ${error.message}`);
    }
  });

  // Wrap the original handleSubmit to save user messages
  const wrappedHandleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    const userInput = input;
    
    // Save user message first
    try {
      await handleSubmit(event, userInput);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
    
    // Then continue with original submission
    originalHandleSubmit(event);
  }, [handleSubmit, input, originalHandleSubmit]);

  // Automatically generate titles when messages are added
  useChatTitleUpdater({
    sessionId,
    messages,
    enabled: true
  });

  if (!user) return <Status message="Please sign in to use the chat." />;
  if (chatError) return <Status message={`Error: ${chatError.message}${chatError.stack ? `\n${chatError.stack}` : ''}`} />;
  
  // Show loading state while fetching historical messages
  if (isLoadingHistory && !historyLoaded) {
    return (
      <Loader
        showLogo={false}
        size="sm"
        message="Loading chat history..."
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <MessageList messages={messages} isLoading={isLoading} />
      <div className="fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out left-4 lg:left-24 right-4 xl:right-[calc(24rem+1rem)]">
        <MessageInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={wrappedHandleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
