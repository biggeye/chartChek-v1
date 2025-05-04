// --- app/api/staff/create/route.ts ---
import { NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { createServerService } from '~/utils/supabase/serverService';

  /**
   * Creates a new staff member and their associated auth user.
   * @param {Request} req The incoming request.
   * @returns {Promise<Response>} A JSON response with the created staff member's ID and their associated auth user's ID.
   */
export async function POST(req: Request) {
  const body = await req.json();
  const { email, full_name, account_id, role, facility_ids } = body;

  if (!email || !account_id || !facility_ids?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createServer();
  const adminBase = await createServerService();

  console.log('Creating auth user');
  const authRes = await adminBase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    user_metadata: { full_name, role, account_id },
  });

  console.log('Auth user response:', authRes);

if (authRes.error || !authRes.data?.user?.id) {
  console.error('Failed to create auth user:', authRes.error); // Log the error for debugging
  return NextResponse.json({ error: 'Failed to create auth user', details: authRes.error?.message }, { status: 500 });
}
  const user_id = authRes.data.user.id;
  
  const { data, error } = await supabase.rpc('onboard_staff', {
    staff_email: email,
    staff_name: full_name,
    staff_role: role,
    account_id,
    user_id,
    facility_ids,
  });

  console.log('Supabase response:', data, error);

  if (error) {
    return NextResponse.json({ error: 'DB insert error', details: error }, { status: 500 });
  }

  return NextResponse.json({ success: true, staff_id: data, user_id });
}