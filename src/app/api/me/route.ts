import { createClient } from "@/lib/supabase/server";
import { isAdmin, isCreator } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null, isAdmin: false, isCreator: false });
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    isAdmin: isAdmin(user.id),
    isCreator: isCreator(user.id),
  });
}
