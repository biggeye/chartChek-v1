"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export type ModelRow = {
  id: string;
  value: string;
  label: string;
  provider: string;
  is_enabled: boolean;
  created_at: string;
};

export function useModels() {
  const supabase = useSupabase() as any;

  return useQuery<ModelRow[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("is_enabled", true)
        .order("label");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}