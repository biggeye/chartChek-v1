'use client';

import { useEffect } from 'react';
import { useChat } from 'ai/react';
import { useChatStore } from '~/store/chat/chatStore';
import { createClient } from '~/utils/supabase/client';
import { MessageList } from '~/components/chat/message-list';
import { MessageInput } from '~/components/chat/message-input';
import { useParams } from 'next/navigation';

export default function HistoricalChatPage() {
  const { sessionId } = useParams();
  const { setCurrentSession, sessions, createSession } = useChatStore();
  const supabase = createClient();

  const { messages, setMessages, input, handleInputChange, handleSubmit } = useChat({
    body: { sessionId: sessionId as string },
    id: sessionId as string,
  });

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching historical messages:', error);
        return;
      }

      setMessages(
        data.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          createdAt: msg.created_at,
        }))
      );

      // Ensure Zustand store is in sync
      if (!sessions.find((s) => s.id === sessionId)) {
        createSession(`Chat from ${new Date(data[0]?.created_at).toLocaleString()}`);
      }
      setCurrentSession(sessionId as string);
    }

    if (sessionId) loadMessages();
  }, [sessionId, supabase, setMessages, setCurrentSession, sessions, createSession]);

  return (
    <div className="flex flex-col h-screen">
      <MessageList messages={messages} />
      <MessageInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
