import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '~/utils/supabase/client';

// GET: List all knowledge categories
export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('knowledge_categories')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ categories: data }, { status: 200 });
}

// POST: Add a new knowledge category
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { slug, display_name } = body;

  if (!slug || !display_name) {
    return NextResponse.json({ error: 'slug and display_name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('knowledge_categories')
    .insert([{ slug, display_name }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ category: data?.[0] }, { status: 201 });
} 