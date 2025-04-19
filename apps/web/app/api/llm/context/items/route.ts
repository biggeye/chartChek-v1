import { NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
// Temporary comment-out of problematic imports until correct paths are confirmed


// Handler for creating a new context item
export async function POST(req: Request) {
  try {
    const supabase = await createServer();
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id 

    const body = await req.json();
    console.log(`[API /llm/context/items] Received POST request`);
    console.log(`[API /llm/context/items] Parsed request body:`, {
      type: body.type,
      title: body.title,
      metadata: body.metadata,
      userId,
      contentLength: body.content?.length || 'N/A',
    });

    const {
      type,
      title,
      content,
      metadata = {},
    } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields (type, title, content)' },
        { status: 400 }
      );
    }
   const newItemId = await supabase.from('context_items').insert({
      type,
      title,
      content,
      metadata,
      user_id: userId,
    }).select('id').single();
    
    return NextResponse.json({ id: newItemId }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error(`[API /llm/context/items] Error creating context item:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error: Unable to create context item' },
      { status: 500 }
    );
  }
}