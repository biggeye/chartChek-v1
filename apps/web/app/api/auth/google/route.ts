// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/auth';
import { createServerService } from '~/utils/supabase/serverService';

// app/api/auth/google/route.ts - update this file
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = await createServerService();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the redirect URI from the request or use a default
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  // Generate a state parameter to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store the state in the user's metadata and wait for it to complete
  const { error } = await supabase.auth.admin.updateUserById(
user.id,
    { user_metadata: { oauth_state: state } }
  );
  
  if (error) {
    console.error('[google auth api]: state not saved in user session', error);
    return NextResponse.redirect(`${baseUrl}/sign-in?error=Failed+to+save+state`);
  }
  
  // Verify the state was saved
  const { data: userData } = await supabase.auth.admin.getUserById(user.id);
console.log('[google auth api]: Saved state:', userData?.user?.user_metadata?.oauth_state);
  // Generate the authorization URL
  const authUrl = getAuthUrl(redirectUri, state);
  
  // Redirect to the authorization URL
  return NextResponse.redirect(authUrl);
}