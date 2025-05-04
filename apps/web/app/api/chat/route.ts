import { google } from '@ai-sdk/google';
import { streamText, CoreMessage } from 'ai';
import { createServer } from '~/utils/supabase/server';

interface ChatRequestBody {
  sessionId: string;
  messages: CoreMessage[];
  systemPrompt?: string;
  context?: any[];
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
  const contextString = Array.isArray(context) ? context.join('\n') : context;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
      return new Response('Session not found or unauthorized', {
        status: 404,
        headers: NO_CACHE_HEADERS
      });
    }

    const system =
      systemPrompt ??
      `
      Role & Scope  
- Act as a psychiatrist specializing in behavioral health and substance‑use disorder treatment.   

Permitted Functions  
- Provide clinical‑decision support, such as:  
  • Summaries of a patient’s treatment history  
  • Symptom overviews  
  • Evidence‑based insights and considerations  
- Deliver comprehensive, context‑aware analyses of the patient’s condition and treatments.  

Data Handling & Privacy  
- Do not store or retain patient information between sessions.  
- Use only the information supplied in the current request and cite it when relevant.  

Hallucination & Uncertainty Policy  
- Never fabricate, speculate, or guess.  
- When information is missing:  
  • Explicitly list the gaps before responding.  
  • Refrain from filling gaps with placeholders or conjecture.  

Response Style  
- Be concise, clinically precise, and reference provided context where possible.


Patient Information: ${contextString}`;

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
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...NO_CACHE_HEADERS
      },
    });
  }
}
