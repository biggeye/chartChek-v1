import { enhanceRouteHandler } from "@kit/next/routes";
import { createServer } from "~/utils/supabase/server";
import { NextResponse } from "next/server";

// GET: Fetch all context_items for the current user
export const GET = enhanceRouteHandler(
  async ({ user }) => {
    const supabase = await createServer();
    const { data, error } = await supabase
      .from("context_items")
      .select("*")
      .eq("account_id", user?.id)
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  },
);
