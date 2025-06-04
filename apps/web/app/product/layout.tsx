'use client';

import AppLayout from "./AppLayout";
import { DebugPanel } from "~/components/dev/DebugPanel";
import { createClient } from '~/utils/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { AppLogo } from '~/components/app-logo';
import { Loader2 } from 'lucide-react';
import { Analytics } from "@vercel/analytics/next"


interface UserData {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: accountData } = await supabase
            .from('accounts')
            .select('id, username, avatar_url')
            .eq('id', user.id)
            .single();

          if (accountData) {
            setUserData(accountData);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo className="h-12 w-auto animate-pulse" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading your workspace...</span>
          </div>
        </div>
      </div>
    );
  }


  return (
  
    <AppLayout
      account_id={userData.id}
      username={userData.username}
      avatarUrl={userData.avatar_url}
    >
      {children}
      <DebugPanel />
      <Analytics /> 
    </AppLayout>
 
);
}