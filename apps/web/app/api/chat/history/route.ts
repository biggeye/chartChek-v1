import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { saveChatMessages } from '~/lib/ai/chatHistory';
import { Message, CoreMessage } from 'ai';

export const runtime = 'edge';

// Prevent response caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

interface SaveMessageBody {
  sessionId: string;
  messages: Message[];
  promptId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer();
    const body = await req.json() as SaveMessageBody;
    const { sessionId, messages, promptId } = body;

    if (!sessionId || !messages?.length) {
      return NextResponse.json({ error: 'Missing sessionId or messages' }, { 
        status: 400,
        headers: NO_CACHE_HEADERS
      });
    }

    // First verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: NO_CACHE_HEADERS
      });
    }

    // First check if the session exists and belongs to this user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { 
        status: 404,
        headers: NO_CACHE_HEADERS
      });
    }

    // If promptId is provided, verify it exists and belongs to this user
    if (promptId) {
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', promptId)
        .eq('account_id', user.id)
        .single();

      if (promptError || !prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { 
          status: 404,
          headers: NO_CACHE_HEADERS
        });
      }
    }

    // Save the messages with promptId if provided
    await saveChatMessages({
      sessionId,
      userId: user.id,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        promptId: promptId
      })) as CoreMessage[]
    });

    return NextResponse.json({ success: true }, {
      headers: NO_CACHE_HEADERS
    });
  } catch (err) {
    console.error('History endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { 
      status: 500,
      headers: NO_CACHE_HEADERS
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServer();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const promptId = searchParams.get('promptId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { 
        status: 400,
        headers: NO_CACHE_HEADERS
      });
    }

    // First verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: NO_CACHE_HEADERS
      });
    }

    // First check if the session exists and belongs to this user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { 
        status: 404,
        headers: NO_CACHE_HEADERS
      });
    }

    // Build the query for messages
    let query = supabase
      .from('chat_messages')
      .select('id, role, content, created_at, prompt_id')
      .eq('session_id', sessionId)
      .eq('account_id', user.id);

    // If promptId is provided, filter by it
    if (promptId) {
      query = query.eq('prompt_id', promptId);
    }

    // Execute the query with ordering
    const { data: messages, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: NO_CACHE_HEADERS
      });
    }

    return NextResponse.json({ messages: messages || [] }, {
      headers: NO_CACHE_HEADERS
    });
  } catch (err) {
    console.error('History endpoint error:', err);
    return NextResponse.json({ error: (err as Error).message }, { 
      status: 500,
      headers: NO_CACHE_HEADERS
    });
  }
} 