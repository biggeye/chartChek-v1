import { createServer } from '~/utils/supabase/server';
import { CoreMessage } from 'ai';

interface SaveChatMessagesParams {
  sessionId: string;
  userId: string;
  messages: (CoreMessage & { promptId?: string })[];
}

export const saveChatMessages = async ({
  sessionId,
  userId,
  messages,
}: SaveChatMessagesParams) => {
  const supabase = await createServer();

  if (!userId || !sessionId) {
    throw new Error('User ID and Session ID must be provided.');
  }

  // First check if the session exists and belongs to this user
  const { data: existingSession, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('account_id', userId)
    .single();

  if (sessionError || !existingSession) {
    throw new Error('Session not found or unauthorized');
  }

  const formattedMessages = messages.map((msg) => ({
    id: crypto.randomUUID(),
    session_id: sessionId,
    account_id: userId,
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    prompt_id: msg.promptId
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
