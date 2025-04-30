import { createServer } from '~/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServer();
  const { data, error } = await supabase.from('staff').select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff', details: error }, { status: 500 });
  }

  return NextResponse.json(data);
}
