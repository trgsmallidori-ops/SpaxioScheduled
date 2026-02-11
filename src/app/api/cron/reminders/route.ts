import { createAdminClient } from "@/lib/supabase/admin";
import { reminderEmailSubject, reminderEmailHtml, type ReminderItem } from "@/lib/email-templates";
import { addDays, addWeeks, format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: prefsList } = await admin
    .from("notification_preferences")
    .select("user_id, email, remind_days_before, remind_weeks_before, frequency, locale");

  const sent: string[] = [];
  const localeMap = { en: "en" as const, fr: "fr" as const };

  for (const prefs of prefsList || []) {
    const targetStart = addDays(today, prefs.remind_days_before);
    const targetEnd = addWeeks(targetStart, prefs.remind_weeks_before + 1);
    const startStr = format(targetStart, "yyyy-MM-dd");
    const endStr = format(targetEnd, "yyyy-MM-dd");

    const { data: events } = await admin
      .from("calendar_events")
      .select("id, title, event_type, event_date, course_id")
      .eq("user_id", prefs.user_id)
      .in("event_type", ["assignment", "test", "exam"])
      .gte("event_date", startStr)
      .lte("event_date", endStr)
      .order("event_date")
      .limit(20);

    if (!events?.length) continue;

    const { data: courses } = await admin
      .from("courses")
      .select("id, name")
      .eq("user_id", prefs.user_id);
    const courseNames: Record<string, string> = {};
    (courses || []).forEach((c) => { courseNames[c.id] = c.name || ""; });

    const items: ReminderItem[] = events.map((e) => ({
      title: e.title,
      event_type: e.event_type,
      event_date: e.event_date,
      course: e.course_id ? courseNames[e.course_id] : undefined,
    }));

    const locale = localeMap[prefs.locale === "fr" ? "fr" : "en"];
    const subject = reminderEmailSubject(items, locale);
    const html = reminderEmailHtml(items, locale);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "SpaxioScheduled <onboarding@resend.dev>",
          to: prefs.email,
          subject,
          html,
        }),
      });
      if (res.ok) sent.push(prefs.email);
    } catch {
      // skip
    }
  }

  return NextResponse.json({ sent: sent.length, emails: sent });
}
