import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Format the conversation context for title generation
    const conversationContext = messages
      .slice(0, 3) // Use only first 3 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: `Generate a concise, descriptive title (max 6 words) for this conversation:

${conversationContext}

The title should capture the main topic or question. Be specific and professional. Do not use quotes or colons.

Examples:
- "Patient Assessment Review"
- "Medical Record Analysis"
- "Treatment Plan Discussion"
- "Data Export Request"

Title:`,
        maxTokens: 20,
        temperature: 0.3,
      });

      const title = result.text.trim();
      
      // Validate and clean the title
      const cleanTitle = title
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
        .trim()
        .slice(0, 60); // Limit length

      return NextResponse.json({ 
        title: cleanTitle || 'Chat Session' 
      });

    } catch (aiError) {
      console.error('AI title generation failed:', aiError);
      
      // Fallback to user's first message (truncated)
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const fallbackTitle = firstUserMessage 
        ? firstUserMessage.content.slice(0, 50).replace(/[^\w\s]/g, '').trim()
        : 'Chat Session';

      return NextResponse.json({ 
        title: fallbackTitle 
      });
    }

  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' }, 
      { status: 500 }
    );
  }
} 