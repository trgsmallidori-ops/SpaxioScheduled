import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, handleUnexpectedError } from "@/lib/api-errors";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("Unauthorized", 401);

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account/delete]", error.message);
      return apiError("Failed to delete account", 500, {
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleUnexpectedError(err, "account/delete");
  }
}
