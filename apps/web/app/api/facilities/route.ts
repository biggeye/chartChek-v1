import { NextResponse } from 'next/server'
import { createServer } from '~/utils/supabase/server'

export async function GET() {
  const supabase = await createServer()

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: facilities, error: facErr } = await supabase
    .from('facilities')
    .select('*')
    .eq('account_id', user.id)

  if (!facilities || facErr) {
    return NextResponse.json({ error: 'No facilities found' }, { status: 404 })
  }
// destructure facilities response which is nested in data property
  return NextResponse.json(facilities)
}
