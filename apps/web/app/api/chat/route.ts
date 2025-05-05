import { google } from '@ai-sdk/google';
import { streamText, CoreMessage } from 'ai';
import { createServer } from '~/utils/supabase/server';
import { ChatContext } from '~/types/chat/context';
import { formatContext } from '~/lib/ai/contextFormatter';
import { logger } from '~/lib/logger';

interface ChatRequestBody {
  sessionId: string;
  messages: CoreMessage[];
  systemPrompt?: string;
  context?: string;
}

interface ContextItemResponse {
  context_items: {
    content: string;
    created_at: string;
  };
}

export const runtime = 'edge';

// Prevent response caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function POST(req: Request) {
  const supabase = await createServer();
  const { sessionId, messages, systemPrompt, context } = (await req.json()) as ChatRequestBody;
  
  logger.info('[chat/route] Processing chat request', { 
    sessionId,
    hasContext: !!context,
    contextLength: context?.length,
    messageCount: messages.length
  });

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('[chat/route] Authentication error', authError);
      return new Response('Unauthorized', {
        status: 401,
        headers: NO_CACHE_HEADERS
      });
    }

    // First verify the session exists and belongs to this user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', user.id)
      .single();

    if (sessionError || !session) {
      logger.error('[chat/route] Session error', { sessionError });
      return new Response('Session not found or unauthorized', {
        status: 404,
        headers: NO_CACHE_HEADERS
      });
    }

    // Get context items for this session using a join
    const { data: contextItems, error: contextError } = await supabase
      .from('session_context')
      .select(`
        context_items (
          content,
          created_at
        )
      `)
      .eq('session_id', sessionId)
      .order('context_items.created_at', { ascending: true }) as { data: ContextItemResponse[] | null, error: any };

    if (contextError) {
      logger.error('[chat/route] Context error', { contextError });
      // Continue without context if there's an error
    }

    // Extract content from the nested structure
    const contextContent = contextItems?.map(item => item.context_items.content).filter(Boolean) || [];

    // Combine database context with provided context
    const combinedContext = [
      ...contextContent,
      context
    ].filter(Boolean).join('\n\n');

    logger.debug('[chat/route] Combined context', { 
      contextLength: combinedContext.length,
      numContextItems: contextContent.length
    });

    const system = systemPrompt ?? `
      Role & Scope  
- Act as a psychiatrist specializing in behavioral health and substance‑use disorder treatment.   

Permitted Functions  
- Provide clinical‑decision support, such as:  
  • Summaries of a patient's treatment history  
  • Symptom overviews  
  • Evidence‑based insights and considerations  
- Deliver comprehensive, context‑aware analyses of the patient's condition and treatments.  

Data Handling & Privacy  
- Do not store or retain patient information between sessions.  
- Use only the information supplied in the current request and cite it when relevant.  

Hallucination & Uncertainty Policy  
- Never fabricate, speculate, or guess.
- When information is missing:
  • Explicitly list the gaps before responding.
  • Refrain from filling gaps with placeholders or conjecture.
- All dates, measurements, and clinical details MUST come from the provided context.
- If asked about information not in the context, state "That information is not available in the current context."

Response Style  
- Be concise, clinically precise, and reference provided context where possible.

${combinedContext}`;

    logger.debug('[chat/route] Initializing stream', {
      systemPromptLength: system.length
    });

    // Get the stream from the AI SDK and return it directly
    const result = streamText({
      model: google('gemini-2.5-pro-exp-03-25'),
      messages,
      system,
      temperature: 0.7,
      maxTokens: 64000,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error('[chat/route] Error processing request:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...NO_CACHE_HEADERS
      },
    });
  }
}
