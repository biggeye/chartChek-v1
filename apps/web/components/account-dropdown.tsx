'use client';

import { User } from 'lucide-react';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';

export function AccountDropdown() {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <User className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => signOut.mutateAsync()}>
          <Trans i18nKey="common:signOut" defaults="Sign out" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 