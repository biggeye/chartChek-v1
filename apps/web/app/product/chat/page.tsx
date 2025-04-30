'use client';

import { useEffect } from 'react';
import { useChat } from 'ai/react';
import { useChatStore } from '~/store/chat/chatStore';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';
import { createClient } from '~/utils/supabase/client';
import { useContextQueueStore } from '~/store/chat/contextQueueStore';

const supabase = createClient();
const user = await supabase.auth.getUser();
const userId = user.data?.user?.id;

export default function ChatPage() {
  const { currentSessionId, createSession, setCurrentSession } = useChatStore();

  const { items } = useContextQueueStore();

  const chatProps = useChat({
    body: { sessionId: currentSessionId, context: items, userId: userId },
    id: currentSessionId,
  });

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
  } = chatProps;

  useEffect(() => {
    async function initializeSession() {
      if (!currentSessionId) {
        const newSessionId = await createSession('New Chat Session');
        setCurrentSession(newSessionId);
      } else {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (data && !error) {
          setMessages(
            data.map((msg) => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              createdAt: msg.created_at,
            }))
          );
        } else if (error) {
          console.error('Error loading existing messages:', error);
        }
      }
    }

    initializeSession();
  }, [currentSessionId, createSession, setCurrentSession, setMessages, supabase]);

  return (
    <div className="flex flex-col h-screen">
      <MessageList messages={messages} />
      <div className="fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out left-4 right-4 lg:left-24 xl:right-[calc(24rem+1rem)]">
        <MessageInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}