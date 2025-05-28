import { useUser } from '@kit/supabase/hooks/use-user';
import { usePatientContextActions } from '~/hooks/usePatientContextActions';
import { useChat } from 'ai/react';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '~/utils/supabase/client';
import { Message } from 'ai';
import { Loader } from '../loading';
import { toast } from 'sonner';

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

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { data: user } = useUser();
  const { getSelectedContent } = usePatientContextActions();
  const supabase = createClient();

  const verifySession = async (sessionId: string, userId: string) => {
    return supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', userId)
      .single();
  };

  const handleFinish = useCallback(async (message: Message) => {
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
      if (!res.ok) throw new Error(`Failed to save message: ${res.statusText}`);
    } catch (error) {
      console.error('Failed to save message:', error);
      toast.error('Could not save chat message.');
    }
  }, [sessionId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status: chatStatus,
    error: chatError,
    isLoading
  } = useChat({
    api: '/api/chat',
    id: sessionId,
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

  if (!user) return <Status message="Please sign in to use the chat." />;
  if (chatError) return <Status message={`Error: ${chatError.message}${chatError.stack ? `\n${chatError.stack}` : ''}`} />;

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
