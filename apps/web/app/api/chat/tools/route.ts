import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText, CoreMessage } from 'ai';
import { downloadPDFServer } from '~/lib/services/toolCallService';
import { tools as kipuTools } from '~/product/chat/tools';
import { createServer } from '~/utils/supabase/server';

import { z } from 'zod';

type KipuTools = typeof kipuTools;
type KipuToolNames = keyof KipuTools;

interface ToolCallBody<T extends KipuToolNames> {
  toolName: T;
  args: z.infer<KipuTools[T]['parameters']>;
  context?: string;
}

interface ChatBody {
  model?: string;
  messages: CoreMessage[];
  systemPrompt?: string;
}

type RequestBody = ToolCallBody<KipuToolNames> | ChatBody;

export async function POST(req: Request) {
  const supabase = await createServer();
  console.log('🚀 [API] Chat request received');

  try {
    const body = (await req.json()) as ChatBody;
    const { model, messages, systemPrompt, sessionId } = body; 
    if (!sessionId) {
      throw new Error('sessionId is required.');
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }
        // Save incoming messages immediately (user input)
        await saveMessageHistory({ sessionId, userId: user.id, messages });
    // Handle tool calls
    if ('toolName' in body && 'args' in body) {
      console.log(`🔧 [API] Processing tool call: ${body.toolName}`);
      const tool = kipuTools[body.toolName];
      if (!tool) {
        throw new Error(`Tool ${body.toolName} not found`);
      }

      // Parse and validate the args using the tool's parameters schema
      const parsedArgs = tool.parameters.parse(body.args);
      const result = await tool.execute(parsedArgs as any, {
        toolCallId: body.toolName,
        messages: [],
        abortSignal: undefined
      });

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }





    console.log(`🤖 [API] Using model: ${model || 'gemini-2.5-pro-exp-03-25'}`);
    console.log(`💬 [API] Number of messages: ${messages?.length || 0}`);

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [API] Invalid messages format:', messages);
      throw new Error('Invalid messages: messages must be an array');
    }

    const system = systemPrompt ?? `You are operating as a psychiatrist, operating in behavioral health.

You are authorized to access, process, and present patient-related information to verified healthcare professionals acting within their professional responsibilities. All information shared should be treated in accordance with best practices for privacy and confidentiality.
You may assist with clinical decision-making support, including summarizing a patient's treatment history, presenting symptom overviews, and offering any helpful insights you may be asked for, based on the available data.
You do not retain or store patient information across sessions.  You may however summarize patient information, generate reports, PDFs or any other type of output the user requests.`;

    console.log('📝 [API] System prompt length:', system.length);
    // Helper to flatten tool-invocation parts
    const flattenParts = (parts: any[]) =>
      parts.map((part) =>
        part.type === 'tool-invocation' && part.toolInvocation
          ? { ...part.toolInvocation, type: 'tool-invocation' }
          : part
      );

    // Normalize all messages
   // Only normalize messages that have a 'parts' array
const normalizedMessages = messages.map((msg) => {
  // Defensive: only flatten if parts is an array
  if (Array.isArray((msg as any).parts)) {
    return { ...msg, parts: flattenParts((msg as any).parts) };
  }
  return msg;
});
    console.log('🔧 [API] Initializing stream with tools:', Object.keys(kipuTools));
    const result = streamText({
      system,
      model: google('gemini-2.5-pro-exp-03-25'),
      messages: normalizedMessages,
      tools: { ...kipuTools },
      maxTokens: 64000,
      temperature: 0.7,
      topP: 0.4,
    });



    console.log('📤 [API] Stream initialized, preparing response');
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('💥 [API] Error processing chat request:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return new Response(JSON.stringify({
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}