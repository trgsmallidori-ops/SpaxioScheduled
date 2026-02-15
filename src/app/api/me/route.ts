import { createClient } from "@/lib/supabase/server";
import { isAdmin, isCreator } from "@/lib/auth";
import { FREE_UPLOADS } from "@/lib/stripe";
import { handleUnexpectedError } from "@/lib/api-errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
  let quota: { totalLeft: number; hasUpgraded: boolean; isSubscribed?: boolean; subscriptionEnd?: string | null } | null = null;
  if (user.id) {
    const { data: q } = await supabase
      .from("user_quota")
      .select("free_uploads_used, subscription_status, subscription_uploads_quota, subscription_uploads_used, subscription_current_period_end")
      .eq("user_id", user.id)
      .single();
    if (q) {
      const freeUsed = (q as { free_uploads_used: number }).free_uploads_used ?? 0;
      const freeAvailable = Math.max(0, FREE_UPLOADS - freeUsed);

      let subscriptionAvailable = 0;
      const subStatus = (q as { subscription_status: string | null }).subscription_status;
      if (subStatus === "active" || subStatus === "past_due") {
        const quotaTotal = (q as { subscription_uploads_quota: number }).subscription_uploads_quota ?? 50;
        const quotaUsed = (q as { subscription_uploads_used: number }).subscription_uploads_used ?? 0;
        subscriptionAvailable = Math.max(0, quotaTotal - quotaUsed);
      }

      const totalLeft = freeAvailable + subscriptionAvailable;
      const subscriptionEnd = (q as { subscription_current_period_end: string | null }).subscription_current_period_end ?? null;
      quota = {
        totalLeft,
        hasUpgraded: subStatus === "active" || subStatus === "past_due",
        isSubscribed: subStatus === "active" || subStatus === "past_due",
        subscriptionEnd,
      };
    }
  }
    return NextResponse.json({
      user: { id: user.id, email: user.email },
      isAdmin: isAdminUser,
      isCreator: isCreatorUser,
      quota,
    });
  } catch (err) {
    return handleUnexpectedError(err, "me");
  }
}
