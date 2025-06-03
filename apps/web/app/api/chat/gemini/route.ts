import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText, CoreMessage } from 'ai';
import { createServer } from '~/utils/supabase/server';
import { ChatContext } from '~/types/chat/context';
import { formatContext } from '~/lib/ai/contextFormatter';
import { logger } from '~/lib/logger';

interface ChatRequestBody {
  sessionId: string;
  messages: CoreMessage[];
  systemPrompt?: string;
  context?: string | { content: string }[];
}

interface ContextItemResponse {
  context_items: {
    content: string;
    created_at: string;
  };
}

interface PromptContextItemResponse {
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
  const user = await supabase.auth.getUser();

  const body = await req.json();
  const { sessionId, messages, systemPrompt, context } = body as ChatRequestBody;

  logger.info('[chat/route] Processing chat request', { 
    sessionId,
    hasContext: !!context,
    contextLength: Array.isArray(context) ? context.length : (context?.length ?? 0),
    messageCount: messages.length
  });

  try {
    // Authenticate user
    const userId = await user.data.user?.id;
    if (!userId) {
      logger.error('[chat/route] Authentication error');
      return new Response('Unauthorized', { status: 401, headers: NO_CACHE_HEADERS });
    }

    
    console.log('/api/chat] sessionId: ', sessionId);
    console.log('/api/chat] user: ', userId);
    // Validate session ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('account_id', userId)
      .single();

    if (sessionError || !session) {
      logger.error('[chat/route] Session not found or unauthorized', { sessionError });
      return new Response('Session not found or unauthorized', { status: 404, headers: NO_CACHE_HEADERS });
    }

    // Build contextContent array
    let contextContent: string[] = [];
    if (Array.isArray(context)) {
      contextContent = context.map(item => typeof item === 'string' ? item : item.content).filter(Boolean);
    } else if (typeof context === 'string' && context.trim() !== '') {
      contextContent = [context];
    }

    // Validate context
    if (contextContent.some(c => typeof c !== 'string' || c.trim() === '')) {
      logger.error('[chat/route] Malformed contextContent', { contextContent });
      return new Response(JSON.stringify({ error: 'All context items must be non-empty strings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS },
      });
    }

    const combinedContext = contextContent.join('\n\n');

    // Compose system prompt
    const defaultSystemPrompt = `
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

${combinedContext}`.trim();

    const system = systemPrompt ?? defaultSystemPrompt;

    logger.debug('[chat/route] Final system prompt length:', { length: system.length });

    // Choose model
    const model = google('gemini-2.5-pro-exp-03-25');


    // Only pass role and content to the model
    const minimalMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const result = await streamText({
      model,
      system,
      messages: minimalMessages,
      maxSteps: 5
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        // Log the error for server-side debugging
        console.error('[chat/route] Streaming error:', error);
        // Return a detailed error message to the client
        if (error instanceof Error) return `EdwardFlinsticks: ${error.message}`;
        return `EdwardFlinsticks: ${JSON.stringify(error)}`;
      }
    });

  } catch (error) {
    logger.error('[chat/route] Error processing request:', error);
    if (error instanceof Error && error.stack) {
      logger.error('[chat/route] Error stack:', error.stack);
    }

    // TEMP: Return error message and stack for debugging
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS }
    });
  }
}
