'use client';

import { createClient } from '~/utils/supabase/client';

/**
 * Gets the current user ID from Supabase auth
 * @returns The user ID or 'anonymous' if no user is logged in
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Failed to fetch user from Supabase:', error);
    throw new Error('Unable to retrieve user session');
  }

  const userId = data?.user?.id;

  if (!userId || !isValidUUID(userId)) {
    throw new Error('Invalid or missing user ID');
  }

  return userId;
}

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}
