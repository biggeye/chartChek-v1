import { NextResponse } from 'next/server'
import { createServer } from '~/utils/supabase/server'

export async function GET() {
  const supabase = await createServer()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('account_id')
    .eq('account_id', user.id)
    .single()

  if (staffError || !staff?.account_id) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  return NextResponse.json({ account_id: staff.account_id })
}
