import { NextRequest, NextResponse } from 'next/server';
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// This is a server-side API route, so environment variables are accessible
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

// Helper to get the AI SDK model instance with proper API keys
const getModelInstance = (provider: string, modelName: string) => {
  switch (provider) {
    case 'openai':
      if (!OPENAI_API_KEY) throw new Error('OpenAI API key is not configured');
      return openai(modelName as any);
    case 'anthropic':
      if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key is not configured');
      return anthropic(modelName as any);
    case 'google':
      if (!GOOGLE_API_KEY) throw new Error('Google API key is not configured');
      return google(modelName as any);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, provider, modelName } = await request.json();

    if (!prompt || !provider || !modelName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create system prompt with context if provided
    const systemPrompt = context
      ? `
You are a medical assistant AI helping with patient information. 
Use the following context to inform your responses, but only reference information that is directly relevant to the query.
Do not make up information that is not in the provided context.

CONTEXT:
${context}
`.trim()
      : 'You are a medical assistant AI helping with patient information.';

    // Get the appropriate model instance
    const model = getModelInstance(provider, modelName);

    // Generate the completion
    const result = await generateText({
      model,
      prompt,
      system: systemPrompt,
      maxTokens: 1000,
    });

    return NextResponse.json({ response: result });
  } catch (error) {
    console.error('Error in LLM API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
