import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { downloadPDFServer } from '~/lib/services/toolCallService';
import { tools as kipuTools } from '~/components/chat/tools';

export async function POST(req: Request) {
   const body = await req.json();
  const model = body.model;
  const messages = body.messages;
  const system = body.systemPrompt ?? `You are the lead secretary for a large corporate psychiatric firm.  You are the editor-in-chief for all reports that go out.
  You may be asked to summarize existing evaluations, create new treatment plans based on the state of the patient's records, and to create new evaluations.
  You may also be asked to create reports or PDFs summarizing the state of the patient's records, or to create new reports or evaluations.
  Always provide a thoroughly detailed and professional copy of the report, with all the information you have available.
  `


  const result = generateText({
    system,
    model: model || google('gemini-2.5-pro-exp-03-25'),
    messages,
    maxTokens: 64000,
    temperature: 0.7,
    topP: 0.4,
  });
   return (await result).text;
}