import { NextResponse, NextRequest } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { enhanceRouteHandler } from "@kit/next/routes";


// POST: Create a new context item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const body = await request.json();
    console.log(`[API /context/items] Received POST request`);
    console.log(`[API /context/items] Parsed request body:`, {
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
    const { data: inserted, error: insertError } = await supabase.from('context_items').insert({
      type,
      title,
      content,
      metadata,
      account_id: userId,
    }).select('id').single();

    if (insertError) {
      console.error(`[API /context/items] Supabase insert error:`, insertError);
      return NextResponse.json(
        { error: 'Database Error: Unable to insert context item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error(`[API /context/items] Error creating context item:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error: Unable to create context item' },
      { status: 500 }
    );
  }
}




// GET: Fetch all context_items for the current user
export const GET = enhanceRouteHandler(
  async ({ user }) => {
    const supabase = await createServer();
    const { data, error } = await supabase
      .from("context_items")
      .select("*")
      .eq("account_id", user?.id)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  },
);
