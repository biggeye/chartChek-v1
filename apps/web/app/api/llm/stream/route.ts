import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';

// This is a server-side API route, so environment variables are accessible
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize the OpenAI client directly
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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

    // Generate the completion using the OpenAI client directly
    try {
      console.log('Calling OpenAI API with prompt:', prompt.substring(0, 50) + '...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content || 'No response generated';
      console.log('OpenAI API response received:', content.substring(0, 50) + '...');

      // Return the response
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (modelError) {
      console.error('Error calling OpenAI API:', modelError);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${modelError}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in LLM API route:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
