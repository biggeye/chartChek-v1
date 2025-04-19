import { createServer } from "~/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServer();
  
  await supabase.auth.signOut();
  
  return NextResponse.json({ message: "Signed out successfully" }, { status: 200 });
}
