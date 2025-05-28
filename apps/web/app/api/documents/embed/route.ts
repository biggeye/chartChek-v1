import { NextRequest, NextResponse } from 'next/server';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createServer } from '~/utils/supabase/server';

// POST /api/documents/embed
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer();
    const { content, title, type, account_id } = await req.json();

    if (!content || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: content, title, or type' },
        { status: 400 }
      );
    }

    // Generate embedding using Vercel AI SDK (OpenAI)
    const input = content.replace(/\n/g, ' ');
    const { embedding, usage } = await embed({
      model: openai.embedding('text-embedding-3-small'), // 1536 dims, matches your schema
      value: input,
    });

    // Insert into knowledge_items
    const { data, error } = await supabase
      .from('knowledge_items')
      .insert([
        {
          content,
          title,
          type,
          account_id: type === 'user' ? account_id : null,
          embedding,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, item: data, usage }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}