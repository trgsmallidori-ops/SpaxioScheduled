import { createAdminClient } from "@/lib/supabase/admin";
import { reminderEmailSubject, reminderEmailHtml, type ReminderItem } from "@/lib/email-templates";
import { isSmtpConfigured, sendMail } from "@/lib/mailer";
import { addDays, format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Reminder job: call once per day (e.g. morning). For each user, sends one email
 * only on the day that is exactly X days + Y weeks before their assignment/test/exam.
 * Example: user chose "3 days before" → they get an email 3 days before each event date.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Reminder job not configured (CRON_SECRET)." }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSmtpConfigured("reminder")) {
    return NextResponse.json({ error: "Reminder SMTP not configured." }, { status: 503 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: prefsList } = await admin
    .from("notification_preferences")
    .select("user_id, email, remind_days_before, remind_weeks_before, locale");

  const sent: string[] = [];
  const localeMap = { en: "en" as const, fr: "fr" as const };

  for (const prefs of prefsList || []) {
    const daysBefore = prefs.remind_days_before ?? 0;
    const weeksBefore = prefs.remind_weeks_before ?? 0;
    const totalDaysBefore = daysBefore + weeksBefore * 7;

    // Events that fall on (today + totalDaysBefore) are the ones we remind about today.
    const eventDate = addDays(today, totalDaysBefore);
    const targetEventDateStr = format(eventDate, "yyyy-MM-dd");

    const { data: events } = await admin
      .from("calendar_events")
      .select("id, title, event_type, event_date, course_id")
      .eq("user_id", prefs.user_id)
      .in("event_type", ["assignment", "test", "exam"])
      .eq("event_date", targetEventDateStr)
      .order("event_date")
      .limit(50);

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
      await sendMail({
        to: prefs.email,
        subject,
        html,
        profile: "reminder",
      });
      sent.push(prefs.email);
    } catch (err) {
      console.error("[cron/reminders] failed to send email", err);
    }
  }

  return NextResponse.json({ sent: sent.length, emails: sent, date: todayStr });
}
