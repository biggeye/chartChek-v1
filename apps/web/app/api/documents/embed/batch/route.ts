import { NextRequest, NextResponse } from 'next/server';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createServer } from '~/utils/supabase/server';

// POST /api/documents/embed/batch
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer();
    const { items, type, account_id } = await req.json();
    // items: Array<{ content: string, title: string }>

    if (!Array.isArray(items) || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: items (array) or type' },
        { status: 400 }
      );
    }

    const values = items.map(item => item.content.replace(/\n/g, ' '));
    const { embeddings, usage } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values,
    });

    // Prepare rows for insertion
    const rows = items.map((item, idx) => ({
      content: item.content,
      title: item.title,
      type,
      account_id: type === 'user' ? account_id : null,
      embedding: embeddings[idx],
    }));

    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(rows)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, items: data, usage }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}