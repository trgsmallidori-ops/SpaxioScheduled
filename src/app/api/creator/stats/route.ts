import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCreator } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isCreator(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { count: totalUsers } = await admin.from("profiles").select("*", { count: "exact", head: true });
  const { data: payments } = await admin.from("payments").select("amount_cents");
  const revenue = (payments || []).reduce((s, p) => s + (p.amount_cents || 0), 0);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    revenue,
  });
}
