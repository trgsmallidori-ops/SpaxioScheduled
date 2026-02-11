import { createClient } from "@/lib/supabase/server";
import { isAdmin, isCreator } from "@/lib/auth";
import { FREE_UPLOADS } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({
      user: null,
      isAdmin: false,
      isCreator: false,
      quota: null,
    });
  const isAdminUser = isAdmin(user.id);
  const isCreatorUser = isCreator(user.id);
  let quota: { totalLeft: number; hasUpgraded: boolean } | null = null;
  if (user.id) {
    const { data: q } = await supabase
      .from("user_quota")
      .select("free_uploads_used, paid_uploads_purchased, paid_uploads_used")
      .eq("user_id", user.id)
      .single();
    if (q) {
      const freeUsed = (q as { free_uploads_used: number }).free_uploads_used ?? 0;
      const paidPurchased = (q as { paid_uploads_purchased: number }).paid_uploads_purchased ?? 0;
      const paidUsed = (q as { paid_uploads_used: number }).paid_uploads_used ?? 0;
      const paidAvailable = paidPurchased - paidUsed;
      const totalLeft = Math.max(0, FREE_UPLOADS - freeUsed) + paidAvailable;
      quota = {
        totalLeft,
        hasUpgraded: paidPurchased > 0,
      };
    }
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    isAdmin: isAdminUser,
    isCreator: isCreatorUser,
    quota,
  });
}
