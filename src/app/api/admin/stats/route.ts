import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Admins get free uploads only. No stats exposed. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ message: "Admin: free uploads only. No stats." });
}
