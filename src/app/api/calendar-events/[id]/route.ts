import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_TYPES = ["class", "assignment", "test", "exam", "other"] as const;

function toTime(s: string | null | undefined): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const sec = parts[2] ? parts[2].padStart(2, "0") : "00";
    return `${h}:${m}:${sec}`;
  }
  return null;
}

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
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  let body: {
    title?: string;
    event_date?: string;
    event_time?: string | null;
    end_time?: string | null;
    event_type?: (typeof EVENT_TYPES)[number];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!event || event.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: {
    title?: string;
    event_date?: string;
    event_time?: string | null;
    end_time?: string | null;
    event_type?: (typeof EVENT_TYPES)[number];
    updated_at: string;
  } = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (t) updates.title = t;
  }
  if (body.event_date !== undefined) {
    if (body.event_date === null || body.event_date === "") {
      // keep existing if empty
    } else if (typeof body.event_date === "string" && DATE_ONLY.test(body.event_date.trim())) {
      updates.event_date = body.event_date.trim();
    }
  }
  if (body.event_time !== undefined) {
    updates.event_time = body.event_time === null || body.event_time === "" ? null : toTime(body.event_time) ?? undefined;
  }
  if (body.end_time !== undefined) {
    updates.end_time = body.end_time === null || body.end_time === "" ? null : toTime(body.end_time) ?? undefined;
  }
  if (body.event_type !== undefined && EVENT_TYPES.includes(body.event_type)) {
    updates.event_type = body.event_type;
  }

  const { error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[calendar-events PATCH]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
