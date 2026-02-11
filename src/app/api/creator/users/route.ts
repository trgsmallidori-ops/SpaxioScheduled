import { createAdminClient } from "@/lib/supabase/admin";
import { isCreator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { handleUnexpectedError } from "@/lib/api-errors";
import { NextResponse } from "next/server";

export type CreatorUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isCreator(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: process.env.NODE_ENV === "development" ? error.message : "Failed to load users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: (profiles || []) as CreatorUserRow[],
    });
  } catch (err) {
    return handleUnexpectedError(err, "creator/users");
  }
}
