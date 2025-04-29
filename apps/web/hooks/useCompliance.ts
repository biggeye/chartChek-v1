"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../utils/supabase/client";
import { getCurrentUserId } from "~/utils/supabase/user";
// Inline type for compliance evaluation row (migrate to /types/store/compliance.ts if needed)
export type ComplianceEvaluation = {
  id: number;
  account_id: string;
  evaluation_template_id: number;
  display_order: number;
  name: string;
  description?: string;
  category?: string;
  // Add more fields if your table has them
};

export function useCompliance() {
  const client = createClient();

  const fetchComplianceEvaluations = async (): Promise<ComplianceEvaluation[]> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("No user ID found");

    const { data, error } = await client
      .from("compliance_evaluations")
      .select("*")
      .eq("account_id", userId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as ComplianceEvaluation[];
  };

  // React Query hook for fetching compliance evaluations
  const query = useQuery({
    queryKey: ["compliance_evaluations"],
    queryFn: fetchComplianceEvaluations,
  });

  return query;
}

