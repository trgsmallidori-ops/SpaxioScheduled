import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { addDays, format, endOfMonth, startOfDay, parseISO } from "date-fns";
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
  }

  let body: { start?: string; end?: string; days?: string[]; classSchedule?: ClassScheduleBlock[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    start,
    end,
    days,
    classSchedule,
  } = body;

  const { data: course } = await supabase
    .from("courses")
    .select("id, user_id, term_start_date, term_end_date")
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

  const DAY_TOKENS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const DAY_ALIASES: Record<string, (typeof DAY_TOKENS)[number]> = {
    mon: "Mon", monday: "Mon",
    tue: "Tue", tues: "Tue", tuesday: "Tue",
    wed: "Wed", wednesday: "Wed",
    thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
    fri: "Fri", friday: "Fri",
    sat: "Sat", saturday: "Sat",
    sun: "Sun", sunday: "Sun",
  };
  const normalizeDay = (d: string): (typeof DAY_TOKENS)[number] | null => {
    const t = String(d || "").trim().toLowerCase();
    if (DAY_TOKENS.includes(t as (typeof DAY_TOKENS)[number])) return t as (typeof DAY_TOKENS)[number];
    return DAY_ALIASES[t] ?? null;
  };
  const normalizeDays = (days: string[]): (typeof DAY_TOKENS)[number][] => {
    const out: (typeof DAY_TOKENS)[number][] = [];
    const seen = new Set<string>();
    for (const d of days) {
      const n = normalizeDay(d);
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  };

  const MAX_BLOCKS = 20;
  const rawBlocks: ClassScheduleBlock[] =
    Array.isArray(classSchedule) && classSchedule.length > 0
      ? classSchedule.slice(0, MAX_BLOCKS)
      : start && end && Array.isArray(days) && days.length > 0
        ? [{ days, start, end }]
        : [];
  const blocks: ClassScheduleBlock[] = rawBlocks
    .filter((b) => b.days?.length && b.start && b.end)
    .map((b) => ({
      days: normalizeDays(b.days!),
      start: toTime(b.start!),
      end: toTime(b.end!),
    }))
    .filter((b) => b.days.length > 0);

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
    const UTC_DAY_TOKENS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    const today = startOfDay(new Date());
    let startDate: Date = today;
    let endDate: Date = endOfMonth(addDays(today, 120));
    if (course.term_start_date) {
      const termStart = startOfDay(parseISO(course.term_start_date));
      if (termStart > today) startDate = termStart;
      else startDate = today;
    }
    if (course.term_end_date) {
      const termEnd = startOfDay(parseISO(course.term_end_date));
      endDate = termEnd;
    }
    if (startDate > endDate) endDate = startDate;
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");
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
      const allowedDays = new Set(block.days);
      let d = new Date(startStr + "T12:00:00.000Z");
      const endD = new Date(endStr + "T12:00:00.000Z");
      while (d <= endD) {
        const dayName = UTC_DAY_TOKENS[d.getUTCDay()];
        if (allowedDays.has(dayName)) {
          const eventDateStr = d.toISOString().slice(0, 10);
          events.push({
            user_id: user.id,
            course_id: id,
            title: "Class",
            event_type: "class",
            event_date: eventDateStr,
            event_time: block.start,
            end_time: block.end,
          });
        }
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    if (events.length) await supabase.from("calendar_events").insert(events);
  }

  return NextResponse.json({ ok: true });
}
