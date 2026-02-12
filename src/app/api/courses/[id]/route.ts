import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isValidCourseColor } from "@/lib/courseColors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  let body: { term_start_date?: string | null; term_end_date?: string | null; color?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: {
    term_start_date?: string | null;
    term_end_date?: string | null;
    color?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (body.color !== undefined) {
    if (body.color === null || body.color === "") {
      updates.color = null;
    } else if (isValidCourseColor(body.color)) {
      updates.color = body.color;
    }
  }
  if (body.term_start_date !== undefined) {
    if (body.term_start_date === null || body.term_start_date === "") {
      updates.term_start_date = null;
    } else if (typeof body.term_start_date === "string" && DATE_ONLY.test(body.term_start_date.trim())) {
      updates.term_start_date = body.term_start_date.trim();
    }
  }
  if (body.term_end_date !== undefined) {
    if (body.term_end_date === null || body.term_end_date === "") {
      updates.term_end_date = null;
    } else if (typeof body.term_end_date === "string" && DATE_ONLY.test(body.term_end_date.trim())) {
      updates.term_end_date = body.term_end_date.trim();
    }
  }

  const { error } = await supabase.from("courses").update(updates).eq("id", id);
  if (error) {
    console.error("[courses PATCH]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
