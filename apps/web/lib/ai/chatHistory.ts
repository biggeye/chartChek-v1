import { createServer } from '~/utils/supabase/server';
import { CoreMessage } from 'ai';

export const saveChatMessages = async ({
  sessionId,
  userId,
  messages,
}: {
  sessionId: string;
  userId: string;
  messages: CoreMessage[];
}) => {
  const supabase = await createServer();

  if (!userId || !sessionId) {
    throw new Error('User ID and Session ID must be provided.');
  }

  const formattedMessages = messages.map((msg) => ({
    session_id: sessionId,
    user_id: userId,
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('chat_messages').insert(formattedMessages);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw error;
  }

  // Update session timestamp
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
};
