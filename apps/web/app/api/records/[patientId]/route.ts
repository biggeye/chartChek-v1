import { z } from "zod";
import { enhanceRouteHandler } from "@kit/next/routes";
import { createServer } from "~/utils/supabase/server";
import { NextResponse } from "next/server";

const ParamsSchema = z.object({
  patientId: z.string().min(1)
});

// GET: Fetch all context_items for the user & patient
export const GET = enhanceRouteHandler(
  async ({ user, params }) => {
    const { patientId } = ParamsSchema.parse(params);
    const supabase = await createServer();
    // Query context_items where metadata->>patientId = patientId and account_id = user.id
    const { data, error } = await supabase
      .from("context_items")
      .select("*")
      .eq("account_id", user?.id)
      .contains("metadata", { patientId });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  },
);
