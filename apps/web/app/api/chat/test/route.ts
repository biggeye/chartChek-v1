import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';



export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body;
  const result = streamText({
    model: google('gemini-2.5-pro-exp-03-25'),
    messages,
    temperature: 0.7,
    maxTokens: 64000,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();

}
