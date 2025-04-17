import { createServer } from "~/lib/utils/supabase/server";
import { getUserProfile } from '@kit/supabase/user-profile'; // Updated path (assuming location)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import TestLayout from "./TestLayout";
import Footer from "~/components/modules/Footer";

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode
}) {
  // const cookieStore = cookies(); // No longer needed here if createServer handles it
  const supabase = await createServer(); // Await the promise and remove argument
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error or no user, redirecting to login:", authError?.message);
    redirect("/login");
  }

  // Add validation for existing user ID
  if (!user.id) {
    console.error('Authenticated user missing ID:', user);
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  const username = profile?.username || user.email || 'User'; // Use username, fallback to email, then generic 'User'
  const avatarUrl = profile?.avatar_url || null; // Get avatar_url, default to null

  return (
    <TestLayout user_id={user.id} username={username} avatarUrl={avatarUrl}>
      {children}
    </TestLayout>
  );
}