import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { addDays, format, endOfMonth } from "date-fns";
import { enUS } from "date-fns/locale";
import type { ClassScheduleBlock } from "@/types/database";

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
  const body = await request.json();
  const {
    start,
    end,
    days,
    classSchedule,
  } = body as {
    start?: string;
    end?: string;
    days?: string[];
    classSchedule?: ClassScheduleBlock[];
  };

  const { data: course } = await supabase
    .from("courses")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const toTime = (s: string): string => {
    if (!s || typeof s !== "string") return "09:00:00";
    const parts = s.trim().split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const sec = parts[2] ? parts[2].padStart(2, "0") : "00";
      return `${h}:${m}:${sec}`;
    }
    return "09:00:00";
  };

  const rawBlocks: ClassScheduleBlock[] =
    Array.isArray(classSchedule) && classSchedule.length > 0
      ? classSchedule
      : start && end && Array.isArray(days) && days.length > 0
        ? [{ days, start, end }]
        : [];
  const blocks: ClassScheduleBlock[] = rawBlocks
    .filter((b) => b.days?.length && b.start && b.end)
    .map((b) => ({ days: b.days!, start: toTime(b.start!), end: toTime(b.end!) }));

  const updates: {
    class_time_start?: string | null;
    class_time_end?: string | null;
    class_days?: string[] | null;
    class_schedule?: ClassScheduleBlock[] | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (blocks.length === 1) {
    updates.class_time_start = blocks[0].start;
    updates.class_time_end = blocks[0].end;
    updates.class_days = blocks[0].days;
    updates.class_schedule = blocks;
  } else if (blocks.length > 1) {
    updates.class_time_start = null;
    updates.class_time_end = null;
    updates.class_days = null;
    updates.class_schedule = blocks;
  } else {
    updates.class_time_start = null;
    updates.class_time_end = null;
    updates.class_days = null;
    updates.class_schedule = null;
  }

  await supabase.from("courses").update(updates).eq("id", id);

  const existing = await supabase
    .from("calendar_events")
    .select("id")
    .eq("course_id", id)
    .eq("event_type", "class");
  const toDelete = (existing.data || []).map((e) => e.id);
  if (toDelete.length) {
    await supabase.from("calendar_events").delete().in("id", toDelete);
  }

  if (blocks.length > 0) {
    const startDate = new Date();
    const endDate = endOfMonth(addDays(startDate, 120));
    const events: {
      user_id: string;
      course_id: string;
      title: string;
      event_type: "class";
      event_date: string;
      event_time: string;
      end_time: string;
    }[] = [];
    for (const block of blocks) {
      if (!block.days?.length || !block.start || !block.end) continue;
      let d = new Date(startDate);
      while (d <= endDate) {
        const dayName = format(d, "EEE", { locale: enUS });
        if (block.days.includes(dayName)) {
          events.push({
            user_id: user.id,
            course_id: id,
            title: "Class",
            event_type: "class",
            event_date: format(d, "yyyy-MM-dd"),
            event_time: block.start,
            end_time: block.end,
          });
        }
        d = addDays(d, 1);
      }
    }
    if (events.length) await supabase.from("calendar_events").insert(events);
  }

  return NextResponse.json({ ok: true });
}
