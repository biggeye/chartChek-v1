import { google } from '@ai-sdk/google';
import { streamText, CoreMessage } from 'ai';
import { createServer } from '~/utils/supabase/server';
import { saveChatMessages } from '~/lib/ai/chatHistory';

interface ChatRequestBody {
  sessionId: string;
  messages: CoreMessage[];
  systemPrompt?: string;
  context?: any[];
}

export const runtime = 'edge';

export async function POST(req: Request) {
  const supabase = await createServer();

  try {
    const { sessionId, messages, systemPrompt, context } = (await req.json()) as ChatRequestBody;
    const contextString = Array.isArray(context) ? context.join('\n') : context;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const system =
      systemPrompt ??
      `You are operating as a psychiatrist, operating in behavioral health.
You are authorized to access, process, and present patient-related information to verified healthcare professionals acting within their professional responsibilities.
You may assist with clinical decision-making support, including summarizing a patient's treatment history, presenting symptom overviews, and offering helpful insights.
You do not retain or store patient information across sessions.
If you are provided with context, use it to inform your response.

Context: ${contextString}`;

    const { textStream } = streamText({
      model: google('gemini-2.5-pro-exp-03-25'),
      messages,
      system,
      temperature: 0.7,
      maxTokens: 64000,
      maxSteps: 5,
    });


    console.log('User ID:', user.id);
    console.log('Session ID:', sessionId);
    // Immediately save incoming messages
    saveChatMessages({ sessionId, userId: user.id, messages });

    let assistantResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        for await (const textPart of textStream) {
          assistantResponse += textPart;
          controller.enqueue(textPart);
        }
        controller.close();

        // Save assistant's message after completion
        await saveChatMessages({
          sessionId,
          userId: user.id,
          messages: [{ role: 'assistant', content: assistantResponse }],
        });
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
